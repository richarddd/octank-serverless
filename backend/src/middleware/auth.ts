import Koa from "koa";

const cors: () => Koa.Middleware<
  Koa.DefaultState,
  Koa.DefaultContext,
  any
> = () => (ctx, next) => {
  if (ctx.request.method === "OPTIONS") {
    return next();
  }
  const token = ctx.get("Authorization");
  if (token) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      const { username, sub } = payload;
      if (!username || !sub) {
        ctx.body = {
          error: "invalid token",
        };
        ctx.status = 401;
        return;
      }
      ctx.state.user = {
        username,
        id: sub,
      };
    } catch (e) {
      console.error(e);
      ctx.body = {
        error: "invalid token",
      };
      ctx.status = 401;
      return;
    }
  }
  return next();
};

export default cors;
