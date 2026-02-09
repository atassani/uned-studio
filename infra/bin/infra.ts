#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { StudioCognito } from '../main/studio-cognito';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;

new StudioCognito(app, 'StudioCognito', {
  env: { account, region: 'eu-west-2' },
});
