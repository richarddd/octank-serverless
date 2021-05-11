import AWS from "aws-sdk";
import apiGatewayHandler from "../../apiGatewayHandler";
import { createDatabaseConnection } from "../../db";
import { configureSDK, getEnv, getUserOrThrow } from "../../util";
import Document from "../../entities/Document";

configureSDK();

const USER_POOL_USER_ID = getEnv("USER_POOL_USER_ID")!;

const COGNITO_CLIENT = new AWS.CognitoIdentityServiceProvider({
  region: getEnv("AWS_REGION"),
});

export default apiGatewayHandler(__dirname, async (router) => {
  const connection = await createDatabaseConnection();

  router.get("/users", async (ctx) => {
    const { id: userId } = getUserOrThrow(ctx);

    const documentsRepo = connection.getRepository(Document);

    const [usersResponse, documentCount] = await Promise.all([
      COGNITO_CLIENT.listUsers({
        UserPoolId: USER_POOL_USER_ID,
      }).promise(),
      documentsRepo.count({
        userId,
      } as any),
    ]);

    const users = (usersResponse.Users || []).map((user) => {
      const attributesByName = (user.Attributes || []).reduce(
        (acc, attribute) => {
          acc[attribute.Name] = attribute.Value;
          return acc;
        },
        {} as Record<string, string | undefined>
      );
      return {
        username: user.Username,
        createDate: user.UserCreateDate,
        updateDate: user.UserLastModifiedDate,
        name: attributesByName["name"],
        status: user.UserStatus,
        id: attributesByName["sub"],
        email: attributesByName["email"],
        enabled: user.Enabled,
        documentCount,
      };
    });

    ctx.body = users;
  });
});
