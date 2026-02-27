import type { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

function json(res: NextApiResponse, status: number, body: unknown) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(base64 + padding, 'base64').toString('utf8');
}

function getJwtToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim() || null;
  }

  const cookieToken = req.cookies?.jwt;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

function getJwtPayload(req: NextApiRequest): { sub?: string; email?: string } | null {
  const token = getJwtToken(req);
  if (!token) {
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}

function normalizeCandidate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getCandidateUserIds(payload: { sub?: string; email?: string }): string[] {
  const candidates = [
    normalizeCandidate(payload.sub),
    normalizeCandidate(payload.email),
    payload.email ? normalizeCandidate(`Google_${payload.email}`) : null,
  ].filter((value): value is string => Boolean(value));
  return Array.from(new Set(candidates));
}

function getCandidateScopes(scope: string): string[] {
  if (scope === 'global') {
    return ['global', 'default'];
  }
  return [scope];
}

function getStoreConfig() {
  const tableName = process.env.STUDIO_LEARNING_STATE_TABLE || 'studio-learning-state';
  const region =
    process.env.STUDIO_LEARNING_STATE_REGION ||
    process.env.NEXT_PUBLIC_AWS_REGION ||
    process.env.AWS_REGION ||
    'eu-west-2';

  const adminTableName = process.env.STUDIO_USER_IDENTITY_ADMIN_TABLE || '';
  const adminRegion = process.env.STUDIO_USER_IDENTITY_ADMIN_REGION || region;

  return { tableName, region, adminTableName, adminRegion };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    return json(res, 404, { error: 'not_found' });
  }

  const payload = getJwtPayload(req);
  if (!payload?.sub) {
    return json(res, 401, { error: 'unauthorized' });
  }

  const scope = typeof req.query.scope === 'string' ? req.query.scope : 'global';
  const { tableName, region, adminTableName, adminRegion } = getStoreConfig();
  const client = new DynamoDBClient({ region });

  if (req.method === 'GET') {
    try {
      const candidateUserIds = getCandidateUserIds(payload);
      const candidateScopes = getCandidateScopes(scope);

      let found: {
        userId: string;
        scope: string;
        state: string;
        updatedAt: string;
      } | null = null;

      for (const candidateUserId of candidateUserIds) {
        for (const candidateScope of candidateScopes) {
          const out = await client.send(
            new GetItemCommand({
              TableName: tableName,
              Key: {
                pk: { S: `USER#${candidateUserId}` },
                sk: { S: `SCOPE#${candidateScope}` },
              },
            })
          );
          const item = out.Item;
          if (item?.state?.S) {
            found = {
              userId: candidateUserId,
              scope: candidateScope,
              state: item.state.S,
              updatedAt: item.updatedAt?.S ?? '',
            };
            break;
          }
        }
        if (found) break;
      }

      if (!found) {
        return json(res, 404, { error: 'not_found' });
      }

      // Best-effort migration to canonical sub/global key.
      if (found.userId !== payload.sub || found.scope !== scope) {
        try {
          await client.send(
            new PutItemCommand({
              TableName: tableName,
              Item: {
                pk: { S: `USER#${payload.sub}` },
                sk: { S: `SCOPE#${scope}` },
                state: { S: found.state },
                updatedAt: { S: new Date().toISOString() },
              },
            })
          );
        } catch {
          // Ignore migration failures; read succeeded.
        }
      }

      return json(res, 200, {
        scope,
        state: JSON.parse(found.state),
        updatedAt: found.updatedAt,
      });
    } catch {
      return json(res, 500, { error: 'learning_state_read_failed' });
    }
  }

  if (req.method === 'PUT') {
    const body = req.body;
    if (!body || typeof body !== 'object' || !('state' in body)) {
      return json(res, 400, { error: 'invalid_payload' });
    }

    const updatedAt = new Date().toISOString();

    try {
      await client.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            pk: { S: `USER#${payload.sub}` },
            sk: { S: `SCOPE#${scope}` },
            state: { S: JSON.stringify((body as { state: unknown }).state) },
            updatedAt: { S: updatedAt },
            ...((body as { clientUpdatedAt?: unknown }).clientUpdatedAt &&
            typeof (body as { clientUpdatedAt?: unknown }).clientUpdatedAt === 'string'
              ? { clientUpdatedAt: { S: (body as { clientUpdatedAt: string }).clientUpdatedAt } }
              : {}),
          },
        })
      );

      if (adminTableName && typeof payload.email === 'string' && payload.email.length > 0) {
        try {
          const adminClient = new DynamoDBClient({ region: adminRegion });
          await adminClient.send(
            new PutItemCommand({
              TableName: adminTableName,
              Item: {
                userId: { S: payload.sub },
                lastKnownEmail: { S: payload.email },
                updatedAt: { S: updatedAt },
              },
            })
          );
        } catch {
          // Ignore admin mapping failures; primary learning-state write succeeded.
        }
      }

      return json(res, 200, { scope, updatedAt });
    } catch {
      return json(res, 500, { error: 'learning_state_write_failed' });
    }
  }

  return json(res, 405, { error: 'method_not_allowed' });
}
