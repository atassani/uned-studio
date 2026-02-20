// Lambda@Edge authentication handler for /studio/*
// Supports: OAuth redirect, JWT/cookie validation, guest access

import { CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontRequest } from 'aws-lambda';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

type LearningStateValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

interface LearningStateStore {
  get(userId: string, scope: string): Promise<{ state: LearningStateValue; updatedAt: string } | null>;
  put(params: {
    userId: string;
    scope: string;
    state: LearningStateValue;
    updatedAt: string;
    clientUpdatedAt?: string;
  }): Promise<void>;
}

// Minimal Cognito JWT validation
function getCognitoConfig() {
  const fileConfig = readEdgeAuthConfig();
  const region = fileConfig?.region ?? process.env.NEXT_PUBLIC_AWS_REGION;
  const userPoolId = fileConfig?.userPoolId ?? process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const domain = fileConfig?.domain ?? process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = fileConfig?.clientId ?? process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectSignIn = fileConfig?.redirectSignIn ?? process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN;
  const redirectSignOut = fileConfig?.redirectSignOut ?? process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT;
  const learningStateTable =
    fileConfig?.learningStateTable ?? process.env.STUDIO_LEARNING_STATE_TABLE;
  const learningStateRegion =
    fileConfig?.learningStateRegion ?? process.env.STUDIO_LEARNING_STATE_REGION ?? region;
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
    learningStateTable,
    learningStateRegion,
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
      learningStateTable?: string;
      learningStateRegion?: string;
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

export async function getJwtPayload(
  cookie: string | undefined
): Promise<Record<string, any> | null> {
  if (!cookie) return null;
  const { issuer, jwksUrl } = getCognitoConfig();
  if (!issuer || !jwksUrl) return null;
  // Import jose only when needed (avoids ESM parse errors in Jest)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { jwtVerify, createRemoteJWKSet } = require('jose');
  const jwks = createRemoteJWKSet(new URL(jwksUrl));
  // Extract JWT from cookie (assume cookie is 'jwt=<token>' or similar)
  const match = cookie.match(/jwt=([^;]+)/);
  if (!match) return null;
  const token = match[1];
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      // Accept tokens from Google federated users (sub claim is a Google subject)
      // Optionally check audience: e.g. audience: 'your-client-id',
    });
    return payload;
  } catch (err) {
    return null;
  }
}

export async function isValidJWT(cookie: string | undefined): Promise<boolean> {
  const payload = await getJwtPayload(cookie);
  return Boolean(payload);
}

let getJwtPayloadImpl = getJwtPayload;

export function setGetJwtPayloadImpl(impl: typeof getJwtPayload | null): void {
  getJwtPayloadImpl = impl ?? getJwtPayload;
}

let learningStateStoreImpl: LearningStateStore | null | undefined;

export function setLearningStateStoreImpl(impl: LearningStateStore | null): void {
  learningStateStoreImpl = impl;
}

function getLearningStateStore(): LearningStateStore | null {
  if (learningStateStoreImpl !== undefined) {
    return learningStateStoreImpl;
  }
  learningStateStoreImpl = createDynamoLearningStateStore();
  return learningStateStoreImpl;
}

function createDynamoLearningStateStore(): LearningStateStore | null {
  const { learningStateTable, learningStateRegion } = getCognitoConfig();
  if (!learningStateTable || !learningStateRegion) {
    return null;
  }

  // First try AWS SDK v3 (available in modern Lambda runtimes).
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DynamoDBClient, GetItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
    const client = new DynamoDBClient({ region: learningStateRegion });
    return {
      async get(userId: string, scope: string) {
        const out = await client.send(
          new GetItemCommand({
            TableName: learningStateTable,
            Key: {
              pk: { S: `USER#${userId}` },
              sk: { S: `SCOPE#${scope}` },
            },
          })
        );

        const item = out.Item;
        if (!item || !item.state?.S) {
          return null;
        }
        const updatedAt = item.updatedAt?.S ?? '';
        return { state: JSON.parse(item.state.S), updatedAt };
      },
      async put({ userId, scope, state, updatedAt, clientUpdatedAt }) {
        await client.send(
          new PutItemCommand({
            TableName: learningStateTable,
            Item: {
              pk: { S: `USER#${userId}` },
              sk: { S: `SCOPE#${scope}` },
              state: { S: JSON.stringify(state) },
              updatedAt: { S: updatedAt },
              ...(clientUpdatedAt ? { clientUpdatedAt: { S: clientUpdatedAt } } : {}),
            },
          })
        );
      },
    };
  } catch (error) {
    // Try AWS SDK v2 as fallback.
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AWS = require('aws-sdk');
    const docClient = new AWS.DynamoDB.DocumentClient({ region: learningStateRegion });

    return {
      async get(userId: string, scope: string) {
        const out = await docClient
          .get({
            TableName: learningStateTable,
            Key: {
              pk: `USER#${userId}`,
              sk: `SCOPE#${scope}`,
            },
          })
          .promise();
        if (!out.Item) {
          return null;
        }
        return {
          state: out.Item.state as LearningStateValue,
          updatedAt: (out.Item.updatedAt as string) ?? '',
        };
      },
      async put({ userId, scope, state, updatedAt, clientUpdatedAt }) {
        await docClient
          .put({
            TableName: learningStateTable,
            Item: {
              pk: `USER#${userId}`,
              sk: `SCOPE#${scope}`,
              state,
              updatedAt,
              ...(clientUpdatedAt ? { clientUpdatedAt } : {}),
            },
          })
          .promise();
      },
    };
  } catch (error) {
    return null;
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

function jsonResponse(status: string, body: unknown): CloudFrontRequestResult {
  return {
    status,
    headers: {
      'content-type': [{ key: 'Content-Type', value: 'application/json' }],
      'cache-control': [{ key: 'Cache-Control', value: 'no-store' }],
    },
    body: JSON.stringify(body),
  };
}

function parseRequestJsonBody(request: CloudFrontRequest): Record<string, unknown> | null {
  const reqBody = (request as any).body;
  if (!reqBody || typeof reqBody.data !== 'string') {
    return null;
  }

  try {
    const raw =
      reqBody.encoding === 'base64' ? Buffer.from(reqBody.data, 'base64').toString('utf8') : reqBody.data;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function handler(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> {
  const request: CloudFrontRequest = event.Records[0].cf.request;
  const uri = request.uri;
  const method = request.method ?? 'GET';
  const cookieHeader = request.headers.cookie?.[0]?.value;
  const querystring = request.querystring || '';
  const queryParams = new URLSearchParams(querystring);
  const code = queryParams.get('code');
  const { domain, clientId, redirectSignIn, redirectSignOut } = getCognitoConfig();

  if (uri.startsWith('/studio/me')) {
    const payload = await getJwtPayloadImpl(cookieHeader);
    if (!payload) {
      return {
        status: '401',
        statusDescription: 'Unauthorized',
        headers: {
          'content-type': [{ key: 'Content-Type', value: 'application/json' }],
          'cache-control': [{ key: 'Cache-Control', value: 'no-store' }],
        },
        body: JSON.stringify({ error: 'unauthorized' }),
      };
    }

    const user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
    };

    return {
      status: '200',
      statusDescription: 'OK',
      headers: {
        'content-type': [{ key: 'Content-Type', value: 'application/json' }],
        'cache-control': [{ key: 'Cache-Control', value: 'no-store' }],
      },
      body: JSON.stringify(user),
    };
  }

  if (uri.startsWith('/studio/learning-state')) {
    const payload = await getJwtPayloadImpl(cookieHeader);
    if (!payload?.sub) {
      return jsonResponse('401', { error: 'unauthorized' });
    }

    const store = getLearningStateStore();
    if (!store) {
      return jsonResponse('503', { error: 'learning_state_store_unavailable' });
    }

    const scope = queryParams.get('scope') ?? 'global';
    if (method === 'GET') {
      try {
        const state = await store.get(String(payload.sub), scope);
        if (!state) {
          return jsonResponse('404', { error: 'not_found' });
        }
        return jsonResponse('200', {
          scope,
          state: state.state,
          updatedAt: state.updatedAt,
        });
      } catch {
        return jsonResponse('500', { error: 'learning_state_read_failed' });
      }
    }

    if (method === 'PUT') {
      const body = parseRequestJsonBody(request);
      if (!body || !('state' in body)) {
        return jsonResponse('400', { error: 'invalid_payload' });
      }

      try {
        const updatedAt = new Date().toISOString();
        await store.put({
          userId: String(payload.sub),
          scope,
          state: body.state as LearningStateValue,
          updatedAt,
          clientUpdatedAt:
            typeof body.clientUpdatedAt === 'string' ? body.clientUpdatedAt : undefined,
        });
        return jsonResponse('200', { scope, updatedAt });
      } catch {
        return jsonResponse('500', { error: 'learning_state_write_failed' });
      }
    }

    return jsonResponse('405', { error: 'method_not_allowed' });
  }

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
        'cache-control': [{ key: 'Cache-Control', value: 'no-store' }],
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
