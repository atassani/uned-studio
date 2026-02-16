'use strict';

import { getCognitoLoginUrl } from '../../src/app/hooks/useAuth';

describe('getCognitoLoginUrl', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns a hosted ui url when config is present', () => {
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN = 'https://example.auth';
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'client-id';
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN = 'https://humblyproud.com/studio';

    const url = getCognitoLoginUrl();

    expect(url).toBe(
      'https://example.auth/oauth2/authorize?response_type=code&client_id=client-id&redirect_uri=https%3A%2F%2Fhumblyproud.com%2Fstudio&identity_provider=Google&scope=openid+email+profile'
    );
  });
});
