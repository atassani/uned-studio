#!/bin/bash
# Deploy main infra stack in eu-west-2, using an existing ACM certificate ARN
set -e

STACK_INFRA=StudioCognito

# Load frontend envs if available (for existing Cognito import)
FRONTEND_ENV_FILE="../../frontend/.env.production"
if [ -f "$FRONTEND_ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$FRONTEND_ENV_FILE"
  set +a
fi

EXISTING_COGNITO_USER_POOL_ID=${EXISTING_COGNITO_USER_POOL_ID:-$NEXT_PUBLIC_COGNITO_USER_POOL_ID}
export EXISTING_COGNITO_USER_POOL_ID

EXISTING_COGNITO_USER_POOL_CLIENT_ID=${EXISTING_COGNITO_USER_POOL_CLIENT_ID:-$NEXT_PUBLIC_COGNITO_CLIENT_ID}
export EXISTING_COGNITO_USER_POOL_CLIENT_ID

GOOGLE_OAUTH_CLIENT_ID=$(aws ssm get-parameter --name "/studio/google-oauth/client-id" --with-decryption --region eu-west-2 --query "Parameter.Value" --output text)
export GOOGLE_OAUTH_CLIENT_ID

GOOGLE_OAUTH_CLIENT_SECRET=$(aws ssm get-parameter --name "/studio/google-oauth/client-secret" --with-decryption --region eu-west-2 --query "Parameter.Value" --output text)
export GOOGLE_OAUTH_CLIENT_SECRET

npm run build

#npx cdk diff $STACK_INFRA

npx cdk deploy $STACK_INFRA
