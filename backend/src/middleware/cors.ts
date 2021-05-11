import Koa from "koa";

const cors: () => Koa.Middleware<
  Koa.DefaultState,
  Koa.DefaultContext,
  any
> = () => (ctx, next) => {
  ctx.set("Access-Control-Allow-Origin", "*");
  ctx.set("Access-Control-Allow-Headers", "*");
  ctx.set("Access-Control-Allow-Methods", "*");
  return next();
};

export default cors;
