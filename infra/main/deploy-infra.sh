#!/bin/bash
# Deploy main infra stack in eu-west-2, using an existing ACM certificate ARN
set -e

STACK_INFRA=StudioCognito

#STACK_CERT=CertificateStack
#CERTIFICATE_ARN=$(aws cloudformation describe-stacks --region us-east-1 --stack-name $STACK_CERT \
#  --query "Stacks[0].Outputs[?OutputKey=='CertificateArn'].OutputValue" --output text)

GOOGLE_OAUTH_CLIENT_ID=$(aws ssm get-parameter --name "/studio/google-oauth/client-id" --with-decryption --region eu-west-2 --query "Parameter.Value" --output text)
export GOOGLE_OAUTH_CLIENT_ID

GOOGLE_OAUTH_CLIENT_SECRET=$(aws ssm get-parameter --name "/studio/google-oauth/client-secret" --with-decryption --region eu-west-2 --query "Parameter.Value" --output text)
export GOOGLE_OAUTH_CLIENT_SECRET

#if [ -z "$CERTIFICATE_ARN" ]; then
#  echo "Could not find ACM Certificate ARN. Please deploy the certificate stack first."
#  exit 1
#fi

#echo "Using ACM Certificate ARN: $CERTIFICATE_ARN"

npm run build

# Export the variable so it is available to the CDK process
#export CERTIFICATE_ARN
#npx cdk deploy $STACK_INFRA

npx cdk diff $STACK_INFRA
