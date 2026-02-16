import * as cdk from 'aws-cdk-lib/core';
import { aws_cloudfront as cloudfront, aws_lambda as lambda } from 'aws-cdk-lib';
import { StudioInfra } from '../../main/studio-infra';

test('passes edge lambdas to studio behaviors', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');

  const functionVersion = lambda.Version.fromVersionArn(
    stack,
    'EdgeVersion',
    'arn:aws:lambda:us-east-1:123456789012:function:edge-auth:1'
  );

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
