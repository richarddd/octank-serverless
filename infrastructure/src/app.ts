#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import FrontendStack from "./frontend-stack";
import FrontendDepoymentStack from "./frontend-deployment-stack";
import LambdaStack from "./lambda-stack";
import { STAGE, toTitleCase } from "./utils";
import { VpcStack } from "./vpc-stack";
import DatabaseStack from "./database-stack";
import ApiStack from "./api-stack";
import { execSync } from "child_process";
import IdentityStack from "./identity-stack";

const serviceName = "octank-v2-demo";
const stackName = toTitleCase(
  `${serviceName}-${STAGE}`.replace(/-./g, (m) => m[1].toUpperCase())
);

class OctankApplication extends cdk.Stack {
  constructor(scope: cdk.Construct, props: cdk.StackProps) {
    super(scope, stackName, props);

    const stage = STAGE;

    const vpcStack = new VpcStack(this, "VpcStack", { stage });
    const { vpc } = vpcStack;

    const { frontendDistribution, frontendBucket } = new FrontendStack(
      this,
      "FrontendStack"
    );
    const { databaseClusterArn, databaseCredentialsSecret } = new DatabaseStack(
      this,
      "DatabaseStack",
      {
        stage,
        vpc,
        serviceName,
      }
    );

    const { identityResources } = new IdentityStack(this, "IdentityStack", {
      serviceName,
      stage,
      frontendUrl: `https://${frontendDistribution.distributionDomainName}`,
    });

    const { lambdaFunctions } = new LambdaStack(this, "LambdaStack", {
      serviceName,
      stage,
      databaseClusterArn,
      databaseCredentialsSecret,
      identityResources,
    });

    new ApiStack(this, "ApiStack", {
      stage,
      serviceName,
      lambdaFunctions,
      identityResources,
    });
  }
}

execSync("rm -rf cdk.out");

const app = new cdk.App();
new OctankApplication(app, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
app.synth();
