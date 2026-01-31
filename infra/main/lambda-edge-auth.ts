// Lambda@Edge authentication handler for /uned/studio/*
// Supports: OAuth redirect, JWT/cookie validation, guest access

import { CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontRequest } from 'aws-lambda';

// Minimal Cognito JWT validation
const COGNITO_REGION = 'eu-west-2';
const COGNITO_USER_POOL_ID = '***REMOVED***';
const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
const JWKS_URL = `${COGNITO_ISSUER}/.well-known/jwks.json`;

export async function isValidJWT(cookie: string | undefined): Promise<boolean> {
  if (!cookie) return false;
  // Import jose only when needed (avoids ESM parse errors in Jest)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { jwtVerify, createRemoteJWKSet } = require('jose');
  const jwks = createRemoteJWKSet(new URL(JWKS_URL));
  // Extract JWT from cookie (assume cookie is 'jwt=<token>' or similar)
  const match = cookie.match(/jwt=([^;]+)/);
  if (!match) return false;
  const token = match[1];
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: COGNITO_ISSUER,
      // Accept tokens from Google federated users (sub claim is a Google subject)
      // Optionally check audience: e.g. audience: 'your-client-id',
    });
    // Accept if token is valid and issued by Cognito (including federated Google users)
    return true;
  } catch (err) {
    return false;
  }
}

const LOGIN_URL = '/uned/studio/login';

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
  const request: CloudFrontRequest = event.Records[0].cf.request;
  const uri = request.uri;
  const cookieHeader = request.headers.cookie?.[0]?.value;

  // Allow guest access for /uned/studio/guest
  if (uri.startsWith('/uned/studio/guest')) {
    return request;
  }

  // Allow if valid JWT/cookie
  if (await isValidJWT(cookieHeader)) {
    return request;
  }

  // Redirect unauthenticated access to /uned/studio/app to /uned/studio/login (no query params)
  if (uri.startsWith('/uned/studio/app')) {
    return {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{ key: 'Location', value: LOGIN_URL }],
        'cache-control': [{ key: 'Cache-Control', value: 'no-cache' }],
      },
      body: '',
    };
  }

  // Allow public access to other /uned/studio paths
  return request;
}
