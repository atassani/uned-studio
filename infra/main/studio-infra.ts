import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib/core';
import { aws_cloudfront as cloudfront, aws_s3 as s3 } from 'aws-cdk-lib';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface StudioInfraProps {
  edgeLambdas?: cloudfront.EdgeLambda[];
}

export class StudioInfra extends Construct {
  public readonly studioBucket: s3.Bucket;
  public readonly behaviors: Record<string, cloudfront.BehaviorOptions>;

  constructor(scope: Construct, id: string, props: StudioInfraProps = {}) {
    super(scope, id);

    this.studioBucket = new s3.Bucket(this, 'HumblyProudStudioBucket', {
      bucketName: 'studio.humblyproud.com',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const codePath = path.join(__dirname, 'cloudfront-functions', 'studio-routing.js');
    const code = fs.readFileSync(codePath, 'utf8');
    const studioRoutingFunction = new cloudfront.Function(this, 'StudioRoutingFunction', {
      code: cloudfront.FunctionCode.fromInline(code),
    });

    const htmlBehaviorOptions: cloudfront.BehaviorOptions = {
      origin: S3BucketOrigin.withOriginAccessControl(this.studioBucket),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      compress: true,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
    };
    const behaviorOptions: cloudfront.BehaviorOptions = props.edgeLambdas
      ? { ...htmlBehaviorOptions, edgeLambdas: props.edgeLambdas }
      : {
          ...htmlBehaviorOptions,
          functionAssociations: [
            {
              function: studioRoutingFunction,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        };

    this.behaviors = {
      'studio/_next/*': {
        origin: S3BucketOrigin.withOriginAccessControl(this.studioBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      'studio': behaviorOptions,
      'studio/*': behaviorOptions,
    };
  }
}
