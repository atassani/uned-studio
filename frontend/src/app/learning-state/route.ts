import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

function json(status: number, body: unknown) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(base64 + padding, 'base64').toString('utf8');
}

function getJwtToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim() || null;
  }

  const cookieToken = request.cookies.get('jwt')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

function getJwtPayload(request: NextRequest): { sub?: string; email?: string } | null {
  const token = getJwtToken(request);
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

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return json(404, { error: 'not_found' });
  }

  const payload = getJwtPayload(request);
  if (!payload?.sub) {
    return json(401, { error: 'unauthorized' });
  }

  const scope = request.nextUrl.searchParams.get('scope') ?? 'global';
  const { tableName, region } = getStoreConfig();
  const client = new DynamoDBClient({ region });

  try {
    const out = await client.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          pk: { S: `USER#${payload.sub}` },
          sk: { S: `SCOPE#${scope}` },
        },
      })
    );

    const item = out.Item;
    if (!item || !item.state?.S) {
      return json(404, { error: 'not_found' });
    }

    return json(200, {
      scope,
      state: JSON.parse(item.state.S),
      updatedAt: item.updatedAt?.S ?? '',
    });
  } catch {
    return json(500, { error: 'learning_state_read_failed' });
  }
}

export async function PUT(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return json(404, { error: 'not_found' });
  }

  const payload = getJwtPayload(request);
  if (!payload?.sub) {
    return json(401, { error: 'unauthorized' });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || !('state' in body)) {
    return json(400, { error: 'invalid_payload' });
  }

  const scope = request.nextUrl.searchParams.get('scope') ?? 'global';
  const { tableName, region, adminTableName, adminRegion } = getStoreConfig();
  const updatedAt = new Date().toISOString();
  const client = new DynamoDBClient({ region });

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

    return json(200, { scope, updatedAt });
  } catch {
    return json(500, { error: 'learning_state_write_failed' });
  }
}
