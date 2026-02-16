describe('Cognito JWT validation', () => {
  beforeAll(() => {
    // Patch jose mock to accept the simulated Cognito JWT
    const jose = require('jose');
    jose.jwtVerify.mockImplementation(async (token: any, jwks: any, options: any) => {
      if (token === 'eyJraWQiOiJr...validtoken...') {
        return { payload: { sub: 'google-user', iss: options.issuer } };
      }
      throw new Error('Invalid token');
    });
  });
  it('should validate a Cognito JWT (simulated)', async () => {
    // Simulate a Cognito JWT cookie
    const validCognitoJwt = 'jwt=eyJraWQiOiJr...validtoken...';
    const result = await authModule.isValidJWT(validCognitoJwt);
    expect(result).toBe(true);
  });
});
// Mock jose imports to avoid Jest ES module parse error
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(),
}));
// infra/test/lambda-edge-auth.test.ts
// Jest test scaffold for Lambda@Edge authentication handler

import * as authModule from '../../main/lambda-edge-auth';

describe('Lambda@Edge Auth Handler', () => {
  beforeAll(() => {
    // Mock isValidJWT to avoid real JWT validation/network
    jest.spyOn(authModule, 'isValidJWT').mockImplementation(async (cookie: string | undefined) => {
      // Simulate valid JWT only if cookie is 'jwt=valid'
      return cookie === 'jwt=valid';
    });
  });
  function makeEvent({ uri, cookie }: { uri: string; cookie?: string }) {
    return {
      Records: [
        {
          cf: {
            request: {
              uri,
              querystring: '',
              headers: cookie ? { cookie: [{ key: 'Cookie', value: cookie }] } : {},
            },
          },
        },
      ],
    };
  }

  it('should redirect unauthenticated requests to OAuth login', async () => {
    const event = makeEvent({ uri: '/studio/app', cookie: undefined });
    const result = await authModule.handler(event as any);
    // Type guard for CloudFrontResultResponse
    if (result && 'status' in result) {
      expect(result.status).toBe('302');
      expect(result.headers?.location?.[0]?.value).toContain('/studio/login');
    } else {
      throw new Error('Expected a redirect response');
    }
  });

  it('should allow access with valid JWT/cookie', async () => {
    const event = makeEvent({ uri: '/studio/secure', cookie: 'jwt=valid' });
    const result = await authModule.handler(event as any);
    // Type guard for CloudFrontRequest
    if (result && 'uri' in result) {
      expect(result.uri).toBe('/studio/secure');
    } else {
      throw new Error('Expected request to be allowed');
    }
  });

  it('should allow guest access for /studio/guest', async () => {
    const event = makeEvent({ uri: '/studio/guest', cookie: undefined });
    const result = await authModule.handler(event as any);
    if (result && 'uri' in result) {
      expect(result.uri).toBe('/studio/guest');
    } else {
      throw new Error('Expected guest request to be allowed');
    }
  });

  it('should exchange OAuth code and set auth cookie', async () => {
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN = 'https://example.auth';
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'client-id';
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN = 'https://humblyproud.com/studio';

    const exchangeSpy = jest
      .spyOn(authModule, 'exchangeCodeForTokens')
      .mockResolvedValue({ id_token: 'jwt-from-cognito' } as any);

    const event = makeEvent({ uri: '/studio', cookie: undefined }) as any;
    event.Records[0].cf.request.querystring = 'code=mock_code';

    const result = await authModule.handler(event);

    if (result && 'status' in result) {
      expect(result.status).toBe('302');
      expect(result.headers?.location?.[0]?.value).toBe('https://humblyproud.com/studio');
      const setCookie = result.headers?.['set-cookie']?.[0]?.value || '';
      expect(setCookie).toContain('jwt=jwt-from-cognito');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('Secure');
      expect(setCookie).toContain('SameSite=Lax');
    } else {
      throw new Error('Expected a redirect response');
    }

    exchangeSpy.mockRestore();
  });
});
