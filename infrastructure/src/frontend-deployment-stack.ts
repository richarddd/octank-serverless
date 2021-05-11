import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as cdk from "@aws-cdk/core";
import { execSync } from "child_process";
import path from "path";
import ApiStack, { AuthorizerType, AUTHORIZER_TYPES } from "./api-stack";
import { StagedStackProps } from "./utils";

const FRONTEND_DIR = path.resolve("../frontend");

type Props = cdk.StackProps &
  StagedStackProps & {
    frontendBucket: s3.Bucket;
  };

export default class FrontendDeploymentStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    const { frontendBucket } = props;

    // const apiBaseUrl = cdk.Fn.importValue(apiUrlOutputId);

    // const { admin: adminSignInUrl, user: signInUrl } = this.getSignInUrls(
    //   signInUrlOutputIds
    // );

    // this.build({
    //   REACT_APP_SIGN_IN_URL: signInUrl,
    //   REACT_APP_SIGN_IN_URL_ADMIN: adminSignInUrl,
    //   REACT_APP_API_BASE_URL: apiBaseUrl,
    // });

    // new s3Deployment.BucketDeployment(this, "DeployFiles", {
    //   sources: [s3Deployment.Source.asset(path.join(FRONTEND_DIR, "build"))],
    //   destinationBucket: frontendBucket,
    // });
  }

  private getSignInUrls = (signInOutputIds: Record<AuthorizerType, string>) =>
    Object.entries(signInOutputIds).reduce((acc, [key, value]) => {
      acc[key as AuthorizerType] = cdk.Fn.importValue(value);
      return acc;
    }, {} as Record<AuthorizerType, string>);

  private build = (env: Record<string, string>) => {
    console.log("Building frontend... please wait...");
    try {
      const buildOutput = execSync("yarn build", {
        cwd: FRONTEND_DIR,
        env: {
          ...process.env,
          ...env,
        },
      });
      process.stdout.write(buildOutput);
    } catch (error) {
      throw Error("Failed to build frontend!");
    }
  };
}
