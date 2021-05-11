import * as cdk from "@aws-cdk/core";
import { StagedStackProps, toTitleCase } from "./utils";
import * as cognito from "@aws-cdk/aws-cognito";

export const AUTHORIZER_TYPES = ["admin", "user"] as const;

export type AuthorizerType = typeof AUTHORIZER_TYPES[number];

export type IdentityResources = Record<
  AuthorizerType,
  {
    userPool: cognito.UserPool;
    userPoolClient: cognito.UserPoolClient;
  }
>;

type Props = cdk.StackProps &
  StagedStackProps & {
    frontendUrl: string;
  };

export default class IdentityStack extends cdk.Stack {
  private readonly serviceName: string;
  private readonly baseSignInCallbackUrl: string;

  readonly identityResources: IdentityResources;

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);
    const { stage, serviceName, frontendUrl } = props;

    this.serviceName = serviceName;
    this.baseSignInCallbackUrl = frontendUrl;

    this.identityResources = this.createIdentityResources();
  }

  private createIdentityResource = (
    type: AuthorizerType,
    selfSignUpEnabled: boolean = false
  ) => {
    const userPool = new cognito.UserPool(
      this,
      `${toTitleCase(type)}UserPool`,
      {
        userPoolName: `${this.serviceName}-${type}`,
        selfSignUpEnabled,
        autoVerify: {
          email: true,
        },
        userVerification: {
          emailSubject: "Verify your email for Octank",
          emailBody:
            "Thanks for signing up octank! Your verification code is {####}",
          emailStyle: cognito.VerificationEmailStyle.CODE,
        },
        userInvitation: {
          emailSubject: "Invite to join Octank",
          emailBody:
            "Hello {username}, you have been invited to join Octank! Your temporary password is {####}",
        },
        signInAliases: {
          username: true,
          email: true,
          preferredUsername: true,
        },
        standardAttributes: {
          fullname: {
            required: true,
            mutable: true,
          },
          email: {
            required: true,
            mutable: false,
          },
        },
        // customAttributes: {
        //   isEmployee: new cognito.BooleanAttribute({ mutable: true }),
        //   joinedOn: new cognito.DateTimeAttribute({}),
        // },
      }
    );

    const signInCallbackUrl = `${this.baseSignInCallbackUrl}/auth/${type}`;
    const localSignInCallBackUrl = `http://localhost:3000/auth/${type}`;

    const signOutCallbackUrl = `${this.baseSignInCallbackUrl}/logout`;
    const localSignOutCallBackUrl = `http://localhost:3000/logout`;

    const userPoolClient = new cognito.UserPoolClient(
      this,
      `${toTitleCase(type)}UserPoolClient`,
      {
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.COGNITO,
        ],
        userPool,
        authFlows: {
          userPassword: true,
          adminUserPassword: true,
        },
        oAuth: {
          scopes: [
            cognito.OAuthScope.COGNITO_ADMIN,
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.PROFILE,
          ],
          flows: {
            implicitCodeGrant: true,
          },
          callbackUrls: [localSignInCallBackUrl, signInCallbackUrl],
          logoutUrls: [localSignOutCallBackUrl, signOutCallbackUrl],
        },
      }
    );

    const userPoolDomain = new cognito.UserPoolDomain(
      this,
      `${toTitleCase(type)}UserPoolDomain`,
      {
        userPool,
        cognitoDomain: {
          domainPrefix: `${userPoolClient.userPoolClientId}`,
        },
      }
    );

    const signInUrl = userPoolDomain.signInUrl(userPoolClient, {
      redirectUri: signInCallbackUrl,
    });

    new cdk.CfnOutput(this, `SignInUrl${toTitleCase(type)}Output`, {
      value: signInUrl,
    });

    new cdk.CfnOutput(this, `UserPool${toTitleCase(type)}Output`, {
      value: userPool.userPoolId,
    });

    return {
      userPool,
      userPoolClient,
    };
  };

  private createIdentityResources = () => {
    const admin = this.createIdentityResource("admin");
    const user = this.createIdentityResource("user", true);

    return {
      admin,
      user,
    };
  };
}
