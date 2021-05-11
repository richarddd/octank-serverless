import * as cdk from "@aws-cdk/core";
import { StagedStackProps, toTitleCase } from "./utils";
import * as lambda from "@aws-cdk/aws-lambda";
import path from "path";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import * as integrations from "@aws-cdk/aws-apigatewayv2-integrations";
import * as cognito from "@aws-cdk/aws-cognito";
import { ApiLambdaFunctions } from "./lambda-stack";
import { IdentityResources } from "./identity-stack";

export const AUTHORIZER_TYPES = ["admin", "user"] as const;

export type AuthorizerType = typeof AUTHORIZER_TYPES[number];

type Props = cdk.StackProps &
  StagedStackProps & {
    lambdaFunctions: ApiLambdaFunctions;
    identityResources: IdentityResources;
  };

export default class ApiStack extends cdk.Stack {
  private readonly serviceName: string;
  private readonly identityResources: IdentityResources;

  readonly api: apigatewayv2.HttpApi;

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);
    const { stage, serviceName, lambdaFunctions, identityResources } = props;

    this.serviceName = serviceName;
    this.identityResources = identityResources;

    const httpApi = new apigatewayv2.HttpApi(this, "HttpApi", {
      disableExecuteApiEndpoint: false,
      corsPreflight: {
        allowHeaders: ["*"],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.HEAD,
          apigatewayv2.CorsHttpMethod.OPTIONS,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.DELETE,
        ],
        allowOrigins: ["*"],
        maxAge: cdk.Duration.days(10),
      },
    });
    this.api = httpApi;

    const corsIntegration = this.createCorsIntegration();
    const authorizers = this.createAuthorizers();

    for (let [route, item] of Object.entries(lambdaFunctions)) {
      const integration = new integrations.LambdaProxyIntegration({
        handler: item.lambdaFunction,
      });

      const routes = [
        ...httpApi.addRoutes({
          path: `/${route}`,
          methods: [apigatewayv2.HttpMethod.ANY],
          integration: integration,
        }),
        ...httpApi.addRoutes({
          path: `/${route}/{proxy+}`,
          methods: [apigatewayv2.HttpMethod.ANY],
          integration: integration,
        }),
      ];
      if (item.access) {
        routes.forEach((r) => {
          const routeCfn = r.node.defaultChild as apigatewayv2.CfnRoute;
          routeCfn.authorizerId = authorizers[item.access!].ref;
          routeCfn.authorizationType = "JWT";
        });
      }
      //cors, this lambda always respods with 200 ok and cors headers
      httpApi.addRoutes({
        path: `/${route}`,
        methods: [apigatewayv2.HttpMethod.OPTIONS],
        integration: corsIntegration,
      });
      httpApi.addRoutes({
        path: `/${route}/{proxy+}`,
        methods: [apigatewayv2.HttpMethod.OPTIONS],
        integration: corsIntegration,
      });
    }

    new cdk.CfnOutput(this, "ApiUrlOutput", {
      value: this.api.url!,
    });
  }
  createAuthorizers = () =>
    Object.entries(this.identityResources).reduce(
      (acc, [type, { userPoolClient, userPool }]) => {
        const authorizer = new apigatewayv2.CfnAuthorizer(
          this,
          `${toTitleCase(type)}JWTAuthorizer`,
          {
            apiId: this.api.apiId,
            authorizerType: "JWT",
            identitySource: ["$request.header.Authorization"],
            name: `${this.serviceName}-${type}-jwt`,
            jwtConfiguration: {
              audience: [userPoolClient.userPoolClientId],
              issuer: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
            },
          }
        );

        acc[type as AuthorizerType] = authorizer;

        return acc;
      },
      {} as Record<AuthorizerType, apigatewayv2.CfnAuthorizer>
    );

  private createCorsIntegration = () => {
    const corsLambdaFunction = new lambda.Function(
      this,
      "ApiCorsLambdaFunction",
      {
        memorySize: 1024,
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.join(path.resolve(__dirname), "cors-lambda")
        ),
      }
    );

    return new integrations.LambdaProxyIntegration({
      handler: corsLambdaFunction,
    });
  };
}
