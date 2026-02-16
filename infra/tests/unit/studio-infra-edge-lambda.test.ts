import * as cdk from 'aws-cdk-lib/core';
import { aws_cloudfront as cloudfront, aws_lambda as lambda } from 'aws-cdk-lib';
import { StudioInfra } from '../../main/studio-infra';

test('passes edge lambdas to studio behaviors', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');

  const versionArn = cdk.Arn.format(
    {
      service: 'lambda',
      resource: 'function',
      resourceName: 'edge-auth:1',
      region: 'us-east-1',
      account: stack.account,
    },
    stack
  );

  const functionVersion = lambda.Version.fromVersionArn(stack, 'EdgeVersion', versionArn);

  const edgeLambdas: cloudfront.EdgeLambda[] = [
    {
      eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
      functionVersion,
    },
  ];

  const studio = new StudioInfra(stack, 'StudioInfra', { edgeLambdas });

  expect(studio.behaviors['studio'].edgeLambdas).toEqual(edgeLambdas);
  expect(studio.behaviors['studio/*'].edgeLambdas).toEqual(edgeLambdas);
});
