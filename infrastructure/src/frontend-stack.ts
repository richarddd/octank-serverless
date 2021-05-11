import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import path from "path";

export default class FrontendStack extends cdk.Stack {
  readonly frontendBucket: s3.Bucket;
  readonly frontendDistribution: cloudfront.CloudFrontWebDistribution;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "FrontendDistributionAccessIdentity",
      {
        comment: "Access Identity for frontend bucket",
      }
    );

    const frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      versioned: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          maxAge: 3000,
        },
      ],
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cloudfrontS3AccessStatement = new iam.PolicyStatement();
    cloudfrontS3AccessStatement.addActions("s3:GetBucket*");
    cloudfrontS3AccessStatement.addActions("s3:GetObject*");
    cloudfrontS3AccessStatement.addActions("s3:List*");
    cloudfrontS3AccessStatement.addResources(frontendBucket.bucketArn);
    cloudfrontS3AccessStatement.addResources(`${frontendBucket.bucketArn}/*`);
    cloudfrontS3AccessStatement.addCanonicalUserPrincipal(
      accessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
    );

    frontendBucket.addToResourcePolicy(cloudfrontS3AccessStatement);

    const frontendDistribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "FrontendDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: frontendBucket,
              originAccessIdentity: accessIdentity,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        errorConfigurations: [
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
        ],
        // aliasConfiguration: {
        //     names: ["domain.com", "www.domain.com"],
        //     acmCertRef: "TODO"
        // },
      }
    );

    this.frontendBucket = frontendBucket;
    this.frontendDistribution = frontendDistribution;

    new cdk.CfnOutput(this, "CloudfrontUrlOutput", {
      value: `https://${this.frontendDistribution.distributionDomainName}`,
    });
    new cdk.CfnOutput(this, "FrontendBucketOutput", {
      value: `${this.frontendBucket.bucketName}`,
    });
  }
}
