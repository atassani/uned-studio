// Lambda@Edge authentication handler for /studio/*
// Supports: OAuth redirect, JWT/cookie validation, guest access

import { CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontRequest } from 'aws-lambda';
import * as https from 'https';

// Minimal Cognito JWT validation
function getCognitoConfig() {
  const region = process.env.NEXT_PUBLIC_AWS_REGION;
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectSignIn = process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN;
  const issuer =
    region && userPoolId ? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}` : undefined;
  const jwksUrl = issuer ? `${issuer}/.well-known/jwks.json` : undefined;

  return {
    region,
    userPoolId,
    domain,
    clientId,
    redirectSignIn,
    issuer,
    jwksUrl,
  };
}

export async function exchangeCodeForTokens(params: {
  code: string;
  redirectUri: string;
  clientId: string;
  domain: string;
}): Promise<{ id_token?: string } | null> {
  const tokenUrl = new URL('/oauth2/token', params.domain);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: params.clientId,
    code: params.code,
    redirect_uri: params.redirectUri,
  }).toString();

  const responseBody = await postForm(tokenUrl, body);
  try {
    return JSON.parse(responseBody);
  } catch (err) {
    return null;
  }
}

let exchangeCodeForTokensImpl = exchangeCodeForTokens;

export function setExchangeCodeForTokensImpl(
  impl: typeof exchangeCodeForTokens | null
): void {
  exchangeCodeForTokensImpl = impl ?? exchangeCodeForTokens;
}

function postForm(url: URL, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      }
    );

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

export async function isValidJWT(cookie: string | undefined): Promise<boolean> {
  if (!cookie) return false;
  const { issuer, jwksUrl } = getCognitoConfig();
  if (!issuer || !jwksUrl) return false;
  // Import jose only when needed (avoids ESM parse errors in Jest)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { jwtVerify, createRemoteJWKSet } = require('jose');
  const jwks = createRemoteJWKSet(new URL(jwksUrl));
  // Extract JWT from cookie (assume cookie is 'jwt=<token>' or similar)
  const match = cookie.match(/jwt=([^;]+)/);
  if (!match) return false;
  const token = match[1];
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      // Accept tokens from Google federated users (sub claim is a Google subject)
      // Optionally check audience: e.g. audience: 'your-client-id',
    });
    // Accept if token is valid and issued by Cognito (including federated Google users)
    return true;
  } catch (err) {
    return false;
  }
}

const LOGIN_URL = '/studio/login';

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
  const request: CloudFrontRequest = event.Records[0].cf.request;
  const uri = request.uri;
  const cookieHeader = request.headers.cookie?.[0]?.value;
  const querystring = request.querystring || '';
  const queryParams = new URLSearchParams(querystring);
  const code = queryParams.get('code');
  const { domain, clientId, redirectSignIn } = getCognitoConfig();

  // Allow guest access for /studio/guest
  if (uri.startsWith('/studio/guest')) {
    return request;
  }

  // Handle OAuth callback code exchange for Cognito Hosted UI
  if (code && domain && clientId && redirectSignIn) {
    const tokens = await exchangeCodeForTokensImpl({
      code,
      redirectUri: redirectSignIn,
      clientId,
      domain,
    });

    if (tokens?.id_token) {
      const cookie = [
        `jwt=${tokens.id_token}`,
        'Path=/',
        'HttpOnly',
        'Secure',
        'SameSite=Lax',
      ].join('; ');

      return {
        status: '302',
        statusDescription: 'Found',
        headers: {
          location: [{ key: 'Location', value: redirectSignIn }],
          'cache-control': [{ key: 'Cache-Control', value: 'no-cache' }],
          'set-cookie': [{ key: 'Set-Cookie', value: cookie }],
        },
        body: '',
      };
    }
  }

  // Allow if valid JWT/cookie
  if (await isValidJWT(cookieHeader)) {
    return request;
  }

  // Redirect unauthenticated access to /studio/app to /studio/login (no query params)
  if (uri.startsWith('/studio/app')) {
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

  // Allow public access to other /studio paths
  return request;
}
