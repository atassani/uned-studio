import * as cdk from 'aws-cdk-lib/core';
import { aws_cognito as cognito } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export class StudioStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito User Pool for /uned/studio authentication
    // Required for Google OAuth login and JWT validation at Lambda@Edge
    const userPool = new cognito.UserPool(this, 'StudioUserPool', {
      userPoolName: 'studio-users',
      selfSignUpEnabled: false, // No manual sign-up, only Google OAuth
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Cost optimization for dev
    });

    // User Pool Domain for Hosted UI
    const userPoolDomain = new cognito.UserPoolDomain(this, 'StudioUserPoolDomain', {
      userPool,
      cognitoDomain: {
        domainPrefix: 'humblyproud-studio', // Must be globally unique
      },
    });

    // Google Identity Provider (must be created before User Pool Client)
    // Requires envd GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET, obtained from SSM Parameter Store /studio/google-oauth/client-id and /studio/google-oauth/client-secret
    const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!googleClientId) {
      throw new Error(
        'GOOGLE_OAUTH_CLIENT_ID environment variable must be set to the Google OAuth client ID.'
      );
    }
    if (!googleClientSecret) {
      throw new Error(
        'GOOGLE_OAUTH_CLIENT_SECRET environment variable must be set to the Google OAuth client secret.'
      );
    }
    const googleIdp = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleIdP', {
      userPool,
      clientId: googleClientId,
      clientSecretValue: cdk.SecretValue.unsafePlainText(googleClientSecret),
      scopes: ['email', 'openid', 'profile'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
      },
    });

    // User Pool Client for SPA (created after Google IdP)
    // Used by frontend for Cognito Hosted UI login
    const userPoolClient = new cognito.UserPoolClient(this, 'StudioUserPoolClient', {
      userPool,
      userPoolClientName: 'studio-spa-client',
      generateSecret: false, // SPA can't securely store secrets
      authFlows: {
        userSrp: true,
        userPassword: false,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          'https://humblyproud.com/uned/studio',
          'http://localhost:3000/uned/studio', // For local development
        ],
        logoutUrls: [
          'https://humblyproud.com/uned/studio',
          'http://localhost:3000/uned/studio', // For local development
        ],
      },
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.GOOGLE],
    });

    userPoolClient.node.addDependency(googleIdp);

    // Cognito outputs for frontend and Lambda@Edge configuration
    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID for Studio (used for JWT validation at Lambda@Edge)',
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID for Studio SPA (used by frontend for OAuth login)',
    });

    new cdk.CfnOutput(this, 'CognitoHostedUIUrl', {
      value: `https://${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`,
      description: 'Cognito Hosted UI URL for Google authentication (frontend login URL)',
    });

    new cdk.CfnOutput(this, 'CognitoRegion', {
      value: this.region,
      description: 'AWS Region for Cognito configuration (used by frontend and Lambda@Edge)',
    });
  }
}
