import * as ssm from "@aws-cdk/aws-ssm";
import * as cdk from "@aws-cdk/core";
import * as rds from "@aws-cdk/aws-rds";
import * as secretsmanager from "@aws-cdk/aws-secretsmanager";
import { StagedStackProps, toTitleCase } from "./utils";
import * as nodelambda from "@aws-cdk/aws-lambda-nodejs";
import * as lambda from "@aws-cdk/aws-lambda";
import * as fs from "fs";
import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";
import path from "path";
import { execSync } from "child_process";
import { AuthorizerType } from "./api-stack";
import { IdentityResources } from "./identity-stack";

type LambdaApi = "documents" | "admin";

export type ApiLambdaFunction = {
  lambdaFunction: nodelambda.NodejsFunction;
  access?: AuthorizerType;
};

export type ApiLambdaFunctions = Record<LambdaApi, ApiLambdaFunction>;

type Props = cdk.StackProps &
  StagedStackProps & {
    databaseClusterArn: string;
    databaseCredentialsSecret: secretsmanager.Secret;
    identityResources: IdentityResources;
  };

const BASE_BACKEND_PATH = path.resolve("../backend");
const BASE_API_PATH = path.join(BASE_BACKEND_PATH, "/src/api");

type SharedEnv = {
  DATABASE_CLUSTER_ARN: string;
  DATABASE_SECRET_ARN: string;
};

export default class LambdaStack extends cdk.Stack {
  readonly lambdaFunctions: ApiLambdaFunctions;

  private readonly sharedEnv: SharedEnv;

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);
    const { databaseClusterArn, databaseCredentialsSecret, identityResources } =
      props;

    const documentBucket = new s3.Bucket(this, "DocumentBucket", {
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS_MANAGED,

      cors: [
        {
          maxAge: 3000,
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
        },
      ],
    });
    new cdk.CfnOutput(this, "DocumentBucketOutput", {
      value: `${documentBucket.bucketName}`,
    });

    this.sharedEnv = {
      DATABASE_CLUSTER_ARN: databaseClusterArn,
      DATABASE_SECRET_ARN: databaseCredentialsSecret.secretArn,
    };

    //create all api lambda functions and map their access to user pools
    const lambdaFunctions = this.createApiLambdaFunctions({
      env: {
        documents: {
          DOCUMENT_BUCKET_NAME: documentBucket.bucketName,
        },
        admin: {
          USER_POOL_USER_ID: identityResources.user.userPool.userPoolId,
        },
      },
      access: {
        user: ["documents"],
        admin: ["admin"],
      },
      initialPolicy: {
        admin: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [identityResources.user.userPool.userPoolArn],
            actions: ["cognito-idp:ListUsers"],
          }),
        ],
        documents: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [documentBucket.bucketArn],
            actions: ["s3:ListBucket"],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [`${documentBucket.bucketArn}/*`],
            actions: ["s3:PutObject", "s3:GetObject"],
          }),
        ],
      },
    });

    this.lambdaFunctions = lambdaFunctions;
  }

  private createApiLambdaFunctions = ({
    env,
    access,
    initialPolicy,
  }: {
    env: Partial<Record<LambdaApi, Record<string, string>>>;
    access: Record<AuthorizerType, LambdaApi[]>;
    initialPolicy: Partial<Record<LambdaApi, iam.PolicyStatement[]>>;
  }) => {
    const apiDirs = fs.readdirSync(BASE_API_PATH);

    const accessByApi = Object.entries(access).reduce((acc, [type, apis]) => {
      apis.forEach((api) => {
        acc[api] = type as any;
      });
      return acc;
    }, {} as Record<LambdaApi, AuthorizerType>);

    const functions = apiDirs.reduce((acc, dirName) => {
      const apiName = dirName as LambdaApi;
      const entryDir = path.join(BASE_API_PATH, apiName);
      const entry = path.join(entryDir, "/index.ts");

      const lambdaFunction = new nodelambda.NodejsFunction(
        this,
        `${toTitleCase(apiName)}ApiFunction`,
        {
          memorySize: 1024,
          runtime: lambda.Runtime.NODEJS_14_X,
          entry,
          timeout: cdk.Duration.seconds(29),
          handler: "default",
          initialPolicy: initialPolicy[apiName],
          environment: {
            ...this.sharedEnv,
            ...env[apiName],
          },
          tracing: lambda.Tracing.ACTIVE,
          bundling: {
            target: "es2020",
            externalModules: ["aws-sdk"],
            minify: false,
            sourceMap: true,
            define: {
              __dirname: `"${entryDir}"`,
            },
          },
        }
      );

      const secretsManagerRdsCredentialsPolicyStatement =
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          resources: [this.sharedEnv.DATABASE_SECRET_ARN],
          actions: ["secretsmanager:GetSecretValue"],
        });

      const rdsAccessPolicyStatement = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [this.sharedEnv.DATABASE_CLUSTER_ARN],
        actions: ["rds-data:*"],
      });

      lambdaFunction.addToRolePolicy(
        secretsManagerRdsCredentialsPolicyStatement
      );
      lambdaFunction.addToRolePolicy(rdsAccessPolicyStatement);

      acc[apiName] = { lambdaFunction, access: accessByApi[apiName] };

      return acc;
    }, {} as ApiLambdaFunctions);

    execSync(`rm -rf ${path.join(BASE_BACKEND_PATH, ".build")}`);

    return functions;
  };
}
