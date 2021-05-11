import "reflect-metadata";

import Koa from "koa";
import json from "koa-json";
import logger from "koa-logger";
import serverless from "serverless-http";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import path from "path";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import createError from "http-errors";
import cors from "./middleware/cors";
import auth from "./middleware/auth";

const app = new Koa();

const baseRouter = new Router();
baseRouter.get("/", async (ctx) => {
  ctx.body = "hello world!";
});

//middleware
app.use(json());
app.use(logger());
app.use(bodyParser());
app.use(cors());
app.use(auth());

app.use(async (ctx, next) => {
  ctx.response.type = "application/json";
  try {
    await next();
  } catch (err) {
    const fallbackError =
      err ||
      createError(
        500,
        "Unknown internal server error, this is likley an out of memory error"
      );

    const { code, message, status, details, stack } = fallbackError;
    ctx.status = (!isNaN(parseInt(status)) && parseInt(status)) || 500;
    ctx.response.body = {
      message,
      status,
      code,
      stack,
    };
    console.error(fallbackError);
  }
});

const apiGatewayHandler = (
  filename: string,
  callback: (router: Router, app: Koa) => Promise<void>
) => {
  const route = path.basename(filename);
  const apiRouter = new Router({
    prefix: `/${route}`,
  });

  const setup = async () => {
    console.log(`Adding routes for /${route}`);
    await callback(apiRouter, app);
    baseRouter.use(apiRouter.routes(), apiRouter.allowedMethods());
    if (!process.env.IS_LOCAL) {
      app.use(baseRouter.routes()).use(baseRouter.allowedMethods());
    }
  };
  const setupPromise = setup();

  if (process.env.IS_LOCAL) {
    return setupPromise;
  }

  const apiHandler = serverless(app);

  const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    await setupPromise;
    return apiHandler(event, context);
  };

  return handler;
};

export const getApp = () => {
  app.use(baseRouter.routes()).use(baseRouter.allowedMethods());
  return app;
};

export default apiGatewayHandler;
