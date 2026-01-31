#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { StudioStack } from '../main/studio-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;

new StudioStack(app, 'StudioStack', {
  env: { account, region: 'eu-west-2' },
});
