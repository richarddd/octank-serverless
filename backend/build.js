const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { default: ImportGlobPlugin } = require("esbuild-plugin-import-glob");
const { default: dirnamePlugin } = require("./plugins/dirname-plugin");
const { default: typeormPlugin } = require("./plugins/typeorm-entities");

const buildDir = path.join(__dirname, "build");
const srcDir = path.join(__dirname, "src");

execSync(`rm -rf ${buildDir}`);

const { getStackOutputValues, setEnv } = require("../setenv");
const outputValues = getStackOutputValues();

setEnv({
  DOCUMENT_BUCKET_NAME: outputValues["DocumentBucketOutput"],
  USER_POOL_USER_ID: outputValues["UserPoolUserOutput"],
});

const entryPoints = {
  index: path.join(srcDir, "index.ts"),
};

esbuild
  .build({
    entryPoints: entryPoints,
    bundle: true,
    sourcemap: true,
    platform: "node",
    outdir: path.join(__dirname, ".build.local"),
    plugins: [ImportGlobPlugin(), dirnamePlugin],
  })
  .catch(console.error);
