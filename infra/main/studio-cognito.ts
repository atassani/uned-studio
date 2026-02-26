import * as cdk from 'aws-cdk-lib/core';
import { aws_cognito as cognito } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class StudioCognito extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const existingUserPoolId = process.env.EXISTING_COGNITO_USER_POOL_ID;
    const existingHostedUiDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const existingUserPoolClientId = process.env.EXISTING_COGNITO_USER_POOL_CLIENT_ID;

    if (existingUserPoolId && !existingHostedUiDomain) {
      throw new Error(
        'NEXT_PUBLIC_COGNITO_DOMAIN must be set when importing an existing Cognito user pool.'
      );
    }

    // Cognito User Pool for /studio authentication
    // Required for Google OAuth login and JWT validation at Lambda@Edge
    const userPool = existingUserPoolId
      ? cognito.UserPool.fromUserPoolId(this, 'StudioUserPool', existingUserPoolId)
      : new cognito.UserPool(this, 'StudioUserPool', {
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

    const userPoolDomain =
      existingUserPoolId && existingHostedUiDomain
        ? existingHostedUiDomain
        : (() => {
            const domain = new cognito.UserPoolDomain(this, 'StudioUserPoolDomain', {
              userPool,
              cognitoDomain: {
                domainPrefix: 'humblyproud-studio', // Must be globally unique
              },
            });
            return `https://${domain.domainName}.auth.${this.region}.amazoncognito.com`;
          })();

    // Google Identity Provider (must be created before User Pool Client)
    // Requires envd GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET, obtained from SSM Parameter Store /studio/google-oauth/client-id and /studio/google-oauth/client-secret
    const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!existingUserPoolId) {
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
    }
    const googleIdp = existingUserPoolId
      ? undefined
      : new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleIdP', {
          userPool,
          clientId: googleClientId ?? '',
          clientSecretValue: cdk.SecretValue.unsafePlainText(googleClientSecret ?? ''),
          scopes: ['email', 'openid', 'profile'],
          attributeMapping: {
            email: cognito.ProviderAttribute.GOOGLE_EMAIL,
            givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
            familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
          },
        });

    // User Pool Client for SPA (created after Google IdP)
    // Used by frontend for Cognito Hosted UI login
    const userPoolClient = existingUserPoolClientId
      ? cognito.UserPoolClient.fromUserPoolClientId(
          this,
          'StudioUserPoolClient',
          existingUserPoolClientId
        )
      : new cognito.UserPoolClient(this, 'StudioUserPoolClient', {
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
            scopes: [
              cognito.OAuthScope.EMAIL,
              cognito.OAuthScope.OPENID,
              cognito.OAuthScope.PROFILE,
            ],
            callbackUrls: [
              'https://humblyproud.com/studio',
              'http://localhost:3000/studio', // For local development
              'http://localhost:3001/studio', // For local development
            ],
            logoutUrls: [
              'https://humblyproud.com/studio',
              'http://localhost:3000/studio', // For local development
              'http://localhost:3001/studio', // For local development
            ],
          },

          supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.GOOGLE],
        });

    if (!existingUserPoolClientId && googleIdp) {
      userPoolClient.node.addDependency(googleIdp);
    }

    const learningStateTable = new dynamodb.Table(this, 'StudioLearningStateTable', {
      tableName: 'studio-learning-state',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userIdentityAdminTable = new dynamodb.Table(this, 'StudioUserIdentityAdminTable', {
      tableName: 'studio-user-identity-admin',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

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
      value: userPoolDomain,
      description: 'Cognito Hosted UI URL for Google authentication (frontend login URL)',
    });

    new cdk.CfnOutput(this, 'CognitoRegion', {
      value: this.region,
      description: 'AWS Region for Cognito configuration (used by frontend and Lambda@Edge)',
    });

    new cdk.CfnOutput(this, 'LearningStateTableName', {
      value: learningStateTable.tableName,
      description:
        'DynamoDB table used by /studio/learning-state endpoint (set STUDIO_LEARNING_STATE_TABLE in edge runtime)',
    });

    new cdk.CfnOutput(this, 'UserIdentityAdminTableName', {
      value: userIdentityAdminTable.tableName,
      description:
        'DynamoDB table for admin/debug mapping userId -> lastKnownEmail (set STUDIO_USER_IDENTITY_ADMIN_TABLE in edge runtime)',
    });
  }
}
