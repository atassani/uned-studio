// Lambda@Edge authentication handler for /studio/*
// Supports: OAuth redirect, JWT/cookie validation, guest access

import { CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontRequest } from 'aws-lambda';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

// Minimal Cognito JWT validation
function getCognitoConfig() {
  const fileConfig = readEdgeAuthConfig();
  const region = fileConfig?.region ?? process.env.NEXT_PUBLIC_AWS_REGION;
  const userPoolId = fileConfig?.userPoolId ?? process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const domain = fileConfig?.domain ?? process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = fileConfig?.clientId ?? process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectSignIn = fileConfig?.redirectSignIn ?? process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN;
  const redirectSignOut = fileConfig?.redirectSignOut ?? process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT;
  const issuer =
    region && userPoolId ? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}` : undefined;
  const jwksUrl = issuer ? `${issuer}/.well-known/jwks.json` : undefined;

  return {
    region,
    userPoolId,
    domain,
    clientId,
    redirectSignIn,
    redirectSignOut,
    issuer,
    jwksUrl,
  };
}

function readEdgeAuthConfig():
  | {
      region?: string;
      userPoolId?: string;
      domain?: string;
      clientId?: string;
      redirectSignIn?: string;
      redirectSignOut?: string;
    }
  | null {
  const configPath =
    process.env.EDGE_AUTH_CONFIG_PATH ?? path.join(__dirname, 'edge-auth-config.json');
  try {
    if (!fs.existsSync(configPath)) return null;
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
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

function isStaticAsset(uri: string): boolean {
  return /\.[a-zA-Z0-9]+$/.test(uri);
}

function maybeRewriteSpaPath(request: CloudFrontRequest): void {
  const uri = request.uri;
  if (!uri.startsWith('/studio')) return;

  // Strip /studio prefix so the S3 bucket uses root paths
  let stripped = uri.slice('/studio'.length);
  if (!stripped || stripped === '/') {
    request.uri = '/index.html';
    return;
  }

  if (isStaticAsset(stripped)) {
    request.uri = stripped;
    return;
  }

  // SPA fallback: non-asset paths get /index.html
  request.uri = stripped + '/index.html';
}

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
  const request: CloudFrontRequest = event.Records[0].cf.request;
  const uri = request.uri;
  const cookieHeader = request.headers.cookie?.[0]?.value;
  const querystring = request.querystring || '';
  const queryParams = new URLSearchParams(querystring);
  const code = queryParams.get('code');
  const { domain, clientId, redirectSignIn, redirectSignOut } = getCognitoConfig();

  if (uri.startsWith('/studio/logout')) {
    const logoutCookie = [
      'jwt=',
      'Path=/',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
    ].join('; ');
    const logoutAuthCookie = [
      'auth=',
      'Path=/',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'Secure',
      'SameSite=Lax',
    ].join('; ');

    const fallbackLocation = LOGIN_URL;
    const logoutUrl =
      domain && clientId && redirectSignOut
        ? `${domain}/logout?client_id=${encodeURIComponent(
            clientId
          )}&logout_uri=${encodeURIComponent(redirectSignOut)}`
        : fallbackLocation;

    return {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{ key: 'Location', value: logoutUrl }],
        'cache-control': [{ key: 'Cache-Control', value: 'no-cache' }],
        'set-cookie': [
          { key: 'Set-Cookie', value: logoutCookie },
          { key: 'Set-Cookie', value: logoutAuthCookie },
        ],
      },
      body: '',
    };
  }

  // Allow guest access for /studio/guest
  if (uri.startsWith('/studio/guest')) {
    maybeRewriteSpaPath(request);
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
      const authCookie = ['auth=1', 'Path=/', 'Secure', 'SameSite=Lax'].join('; ');

      return {
        status: '302',
        statusDescription: 'Found',
        headers: {
          location: [{ key: 'Location', value: redirectSignIn }],
          'cache-control': [{ key: 'Cache-Control', value: 'no-cache' }],
          'set-cookie': [
            { key: 'Set-Cookie', value: cookie },
            { key: 'Set-Cookie', value: authCookie },
          ],
        },
        body: '',
      };
    }
  }

  // Allow if valid JWT/cookie
  if (await isValidJWT(cookieHeader)) {
    maybeRewriteSpaPath(request);
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
  maybeRewriteSpaPath(request);
  return request;
}
