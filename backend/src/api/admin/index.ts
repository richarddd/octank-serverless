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
    getUserOrThrow(ctx);

    const usersResponse = await COGNITO_CLIENT.listUsers({
      UserPoolId: USER_POOL_USER_ID,
    }).promise();

    const documentsRepository = connection.getRepository(Document);

    const countData = await documentsRepository
      .query(
        `SELECT userId, COUNT(*) as documentCount FROM ${documentsRepository.metadata.givenTableName} GROUP BY userId`
      )
      .then((rows) =>
        (rows as any[]).reduce((acc, { userId, documentCount }) => {
          acc[userId] = parseInt(documentCount);
          return acc;
        }, {} as Record<string, number>)
      );

    const users = (usersResponse.Users || []).map((user) => {
      const attributesByName = (user.Attributes || []).reduce(
        (acc, attribute) => {
          acc[attribute.Name] = attribute.Value;
          return acc;
        },
        {} as Record<string, string | undefined>
      );
      const id = attributesByName["sub"]!;
      return {
        username: user.Username,
        createDate: user.UserCreateDate,
        updateDate: user.UserLastModifiedDate,
        name: attributesByName["name"],
        status: user.UserStatus,
        id,
        email: attributesByName["email"],
        enabled: user.Enabled,
        documentCount: countData[id],
      };
    });

    ctx.body = users;
  });
});
