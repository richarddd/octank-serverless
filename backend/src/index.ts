require("source-map-support").install();

import { getApp } from "./apiGatewayHandler";
// @ts-ignore
import * as apis from "./api/**/index.ts";

const apiModules = apis.default as { default: () => Promise<void> }[];

Promise.all(apiModules.map((module) => module.default))
  .then(() => {
    console.log("Started server on http://localhost:8080");
    getApp().listen(8080);
  })
  .catch(console.error);
