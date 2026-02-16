import * as cdk from 'aws-cdk-lib/core';
import { Template } from 'aws-cdk-lib/assertions';
import { StudioCognito } from '../../main/studio-cognito';

describe('StudioCognito with existing user pool', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('does not create a new user pool or domain', () => {
    process.env.EXISTING_COGNITO_USER_POOL_ID = 'eu-west-2_lGf1JmMyv';
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN =
      'https://humblyproud-studio.auth.eu-west-2.amazoncognito.com';
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-client-secret';

    const app = new cdk.App();
    const stack = new StudioCognito(app, 'StudioCognitoTest', {
      env: { account: '123456789012', region: 'eu-west-2' },
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Cognito::UserPool', 0);
    template.resourceCountIs('AWS::Cognito::UserPoolDomain', 0);
  });
});
