require("dotenv").config();

import createError from "http-errors";
import Koa from "koa";

export const getEnv = (name: string) => process.env[name];

export const configureSDK = () => {
  if (process.env.IS_LOCAL) {
    //don't do top level require if other lambdas are not using the SDK but the utils module
    const AWS = require("aws-sdk");
    const credentials = new AWS.SharedIniFileCredentials({
      profile: "octank",
    });
    AWS.config.credentials = credentials;
  }
};

export const getUserOrThrow = (
  ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, any>
) => {
  const { username, id } = ctx.state.user || {};
  if (!username || !id) {
    throw createError(401, "authentication error: no user found on state");
  }
  return { username, id };
};

export const typecast = <T>(Type: new (...args: any) => T, obj: any) => {
  let t = new Type();
  return Object.assign(t, obj) as T;
};
