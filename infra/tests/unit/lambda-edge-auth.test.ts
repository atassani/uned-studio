describe('Cognito JWT validation', () => {
  beforeAll(() => {
    process.env.EDGE_AUTH_CONFIG_PATH = path.join(os.tmpdir(), 'edge-auth-config-missing.json');
    process.env.NEXT_PUBLIC_AWS_REGION = 'eu-west-2';
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = 'test-pool';

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
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('Lambda@Edge Auth Handler', () => {
  beforeEach(() => {
    process.env.EDGE_AUTH_CONFIG_PATH = path.join(os.tmpdir(), 'edge-auth-config-missing.json');
  });

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
      expect(result.uri).toBe('/studio/index.html');
    } else {
      throw new Error('Expected request to be allowed');
    }
  });

  it('should allow guest access for /studio/guest', async () => {
    const event = makeEvent({ uri: '/studio/guest', cookie: undefined });
    const result = await authModule.handler(event as any);
    if (result && 'uri' in result) {
      expect(result.uri).toBe('/studio/index.html');
    } else {
      throw new Error('Expected guest request to be allowed');
    }
  });

  it('should rewrite studio routes to index.html for SPA', async () => {
    const event = makeEvent({ uri: '/studio/login', cookie: undefined });
    const result = await authModule.handler(event as any);
    if (result && 'uri' in result) {
      expect(result.uri).toBe('/studio/index.html');
    } else {
      throw new Error('Expected request to be allowed');
    }
  });

  it('should not rewrite static assets', async () => {
    const event = makeEvent({ uri: '/studio/assets/logo.png', cookie: undefined });
    const result = await authModule.handler(event as any);
    if (result && 'uri' in result) {
      expect(result.uri).toBe('/studio/assets/logo.png');
    } else {
      throw new Error('Expected request to be allowed');
    }
  });

  it('should exchange OAuth code and set auth cookie', async () => {
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN = 'https://example.auth';
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'client-id';
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN = 'https://humblyproud.com/studio';

    const exchangeMock = jest.fn().mockResolvedValue({ id_token: 'jwt-from-cognito' } as any);
    authModule.setExchangeCodeForTokensImpl(exchangeMock);

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

    authModule.setExchangeCodeForTokensImpl(null);
  });

  it('should redirect to login when code exchange fails', async () => {
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN = 'https://example.auth';
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'client-id';
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN = 'https://humblyproud.com/studio';

    const exchangeMock = jest.fn().mockResolvedValue(null);
    authModule.setExchangeCodeForTokensImpl(exchangeMock);

    const event = makeEvent({ uri: '/studio/app', cookie: undefined }) as any;
    event.Records[0].cf.request.querystring = 'code=bad_code';

    const result = await authModule.handler(event);

    if (result && 'status' in result) {
      expect(result.status).toBe('302');
      expect(result.headers?.location?.[0]?.value).toContain('/studio/login');
    } else {
      throw new Error('Expected a redirect response');
    }

    authModule.setExchangeCodeForTokensImpl(null);
  });

  it('should skip code exchange when env is missing', async () => {
    process.env.EDGE_AUTH_CONFIG_PATH = path.join(os.tmpdir(), 'edge-auth-config-missing.json');
    delete process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    delete process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN;

    const exchangeMock = jest.fn().mockResolvedValue({ id_token: 'jwt-from-cognito' } as any);
    authModule.setExchangeCodeForTokensImpl(exchangeMock);

    const event = makeEvent({ uri: '/studio/app', cookie: undefined }) as any;
    event.Records[0].cf.request.querystring = 'code=mock_code';

    const result = await authModule.handler(event);

    expect(exchangeMock).not.toHaveBeenCalled();

    if (result && 'status' in result) {
      expect(result.status).toBe('302');
      expect(result.headers?.location?.[0]?.value).toContain('/studio/login');
    } else {
      throw new Error('Expected a redirect response');
    }

    authModule.setExchangeCodeForTokensImpl(null);
  });

  it('should redirect to cognito logout and clear cookie', async () => {
    process.env.EDGE_AUTH_CONFIG_PATH = path.join(os.tmpdir(), 'edge-auth-config-missing.json');
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN = 'https://example.auth';
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'client-id';
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT = 'https://humblyproud.com/studio';

    const event = makeEvent({ uri: '/studio/logout', cookie: 'jwt=valid' });
    const result = await authModule.handler(event as any);

    if (result && 'status' in result) {
      expect(result.status).toBe('302');
      expect(result.headers?.location?.[0]?.value).toBe(
        'https://example.auth/logout?client_id=client-id&logout_uri=https%3A%2F%2Fhumblyproud.com%2Fstudio'
      );
      const setCookie = result.headers?.['set-cookie']?.[0]?.value || '';
      expect(setCookie).toContain('jwt=');
      expect(setCookie).toContain('Expires=');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('Secure');
    } else {
      throw new Error('Expected a redirect response');
    }
  });

  it('should read edge auth config from file when present', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-auth-'));
    const configPath = path.join(tempDir, 'edge-auth-config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        domain: 'https://example.auth',
        clientId: 'client-id',
        redirectSignIn: 'https://humblyproud.com/studio',
      })
    );

    process.env.EDGE_AUTH_CONFIG_PATH = configPath;
    delete process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    delete process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN;

    const exchangeMock = jest.fn().mockResolvedValue({ id_token: 'jwt-from-cognito' } as any);
    authModule.setExchangeCodeForTokensImpl(exchangeMock);

    const event = makeEvent({ uri: '/studio', cookie: undefined }) as any;
    event.Records[0].cf.request.querystring = 'code=mock_code';

    const result = await authModule.handler(event);

    if (result && 'status' in result) {
      expect(result.status).toBe('302');
      expect(result.headers?.location?.[0]?.value).toBe('https://humblyproud.com/studio');
      const setCookie = result.headers?.['set-cookie']?.[0]?.value || '';
      expect(setCookie).toContain('jwt=jwt-from-cognito');
    } else {
      throw new Error('Expected a redirect response');
    }

    authModule.setExchangeCodeForTokensImpl(null);
    delete process.env.EDGE_AUTH_CONFIG_PATH;
  });
});
