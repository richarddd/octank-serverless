import apiGatewayHandler from "../../apiGatewayHandler";
import { createDatabaseConnection } from "../../db";
import Document from "../../entities/Document";
import { configureSDK, getEnv, getUserOrThrow, typecast } from "../../util";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import createError from "http-errors";
import mime from "mime-types";

const DOCUMENT_BUCKET_NAME = getEnv("DOCUMENT_BUCKET_NAME")!;

configureSDK();

const S3_CLIENT = new AWS.S3({
  params: { Bucket: DOCUMENT_BUCKET_NAME },
  signatureVersion: "v4",
  region: getEnv("AWS_REGION"),
});

const getConentType = async (key: string) => {
  const s3Object = await S3_CLIENT.getObject({
    Key: key,
    Bucket: DOCUMENT_BUCKET_NAME,
  }).promise();

  return s3Object.ContentType!;
};

export default apiGatewayHandler(__dirname, async (router) => {
  const connection = await createDatabaseConnection();

  router.get("/url", async (ctx) => {
    const { type } = ctx.request.query;
    if (!type) {
      throw createError(400, "Missing type params");
    }
    getUserOrThrow(ctx);

    const key = uuidv4();

    const url = await S3_CLIENT.getSignedUrlPromise("putObject", {
      Key: key,
      Expires: 60 * 5,
      ACL: "private",
      ContentType: mime.lookup(type as string),
    });
    ctx.body = { key, url };
  });

  router.post("/", async (ctx) => {
    const documentsRepo = connection.getRepository(Document);

    const documentRequest = typecast(Document, ctx.request.body);
    const { id } = getUserOrThrow(ctx);
    documentRequest.userId = id;
    delete documentRequest.id;

    const now = new Date();

    const contentType = await getConentType(documentRequest.key);

    documentRequest.createDate = now;
    documentRequest.updateDate = now;
    documentRequest.contentType = contentType;

    const insertResult = await documentsRepo.save(documentRequest);
    ctx.body = insertResult;
  });

  router.get("/:id", async (ctx) => {
    const documentsRepo = connection.getRepository(Document);

    const { id: idString } = ctx.params;

    const id = parseInt(idString);

    const { id: userId } = getUserOrThrow(ctx);

    const document = await documentsRepo.findOneOrFail({
      id,
      userId,
    });

    const [url, previewUrl] = await Promise.all([
      S3_CLIENT.getSignedUrlPromise("getObject", {
        Key: document.key,
        Expires: 60 * 5,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
          document.title
        )}"`,
      }),
      S3_CLIENT.getSignedUrlPromise("getObject", {
        Key: document.key,
        Expires: 60 * 5,
        ResponseContentDisposition: `inline; filename="${encodeURIComponent(
          document.title
        )}"`,
      }),
    ]);

    ctx.body = { ...document, url, previewUrl };
  });

  router.post("/:id", async (ctx) => {
    const documentsRepo = connection.getRepository(Document);

    const { id: idString } = ctx.params;

    const id = parseInt(idString);

    const { id: userId } = getUserOrThrow(ctx);

    const documentRequest = typecast(Document, ctx.request.body);
    delete documentRequest.id;
    delete documentRequest.userId;
    delete documentRequest.createDate;
    delete documentRequest.updateDate;
    delete documentRequest.contentType;

    const critera = {
      id,
      userId,
    };

    const contentType = await getConentType(documentRequest.key);

    const updateRequst = await documentsRepo.update(critera, {
      ...documentRequest,
      contentType,
      updateDate: new Date(),
    });

    const url = await S3_CLIENT.getSignedUrlPromise("getObject", {
      Key: documentRequest.key,
      Expires: 60 * 5,
    });

    ctx.body = { ...updateRequst, url };
  });

  router.get("/", async (ctx) => {
    const documentsRepo = connection.getRepository(Document);

    const { id: userId } = getUserOrThrow(ctx);

    // //add more load on the database
    // await Promise.all(
    //   new Array(10).fill(0).map(async () => {
    //     const doc2 = await documentsRepo.find({
    //       userId,
    //     });
    //   })
    // );

    const documents = await documentsRepo.find({ userId });
    ctx.body = documents;
  });
});
