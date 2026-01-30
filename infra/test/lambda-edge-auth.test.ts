// infra/test/lambda-edge-auth.test.ts
// Jest test scaffold for Lambda@Edge authentication handler

import { handler } from '../main/lambda-edge-auth';

describe('Lambda@Edge Auth Handler', () => {
  function makeEvent({ uri, cookie }: { uri: string; cookie?: string }) {
    return {
      Records: [
        {
          cf: {
            request: {
              uri,
              headers: cookie ? { cookie: [{ key: 'Cookie', value: cookie }] } : {},
            },
          },
        },
      ],
    };
  }

  it('should redirect unauthenticated requests to OAuth login', async () => {
    const event = makeEvent({ uri: '/uned/studio/app', cookie: undefined });
    const result = await handler(event as any);
    // Type guard for CloudFrontResultResponse
    if (result && 'status' in result) {
      expect(result.status).toBe('302');
      expect(result.headers?.location?.[0]?.value).toContain('/uned/studio/login');
    } else {
      throw new Error('Expected a redirect response');
    }
  });

  it('should allow access with valid JWT/cookie', async () => {
    const event = makeEvent({ uri: '/uned/studio/secure', cookie: 'jwt=valid' });
    const result = await handler(event as any);
    // Type guard for CloudFrontRequest
    if (result && 'uri' in result) {
      expect(result.uri).toBe('/uned/studio/secure');
    } else {
      throw new Error('Expected request to be allowed');
    }
  });

  it('should allow guest access for /uned/studio/guest', async () => {
    const event = makeEvent({ uri: '/uned/studio/guest', cookie: undefined });
    const result = await handler(event as any);
    if (result && 'uri' in result) {
      expect(result.uri).toBe('/uned/studio/guest');
    } else {
      throw new Error('Expected guest request to be allowed');
    }
  });
});
