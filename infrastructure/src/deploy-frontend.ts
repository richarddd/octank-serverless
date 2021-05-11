import AWS from "aws-sdk";
import { execSync } from "child_process";
import { readFile, readdir, stat, fstat } from "fs";
import path from "path";
import { promisify } from "util";
import mime from "mime-types";

const cdk = require("../cdk.json");

const readFileAsync = promisify(readFile);
const readdirAsync = promisify(readdir);
const statAsync = promisify(stat);

const profile = cdk.profile;

if (!profile) {
  throw new Error("Missing profile!");
} else {
  console.log(`Using profile: ${profile}`);
}

const credentials = new AWS.SharedIniFileCredentials({ profile });
AWS.config.credentials = credentials;

const S3_CLIENT = new AWS.S3();
const FRONTEND_DIR = path.resolve("../frontend");

const rateLimitedPromiseAll = async <T>(
  promiseFunctions: (() => Promise<T>)[],
  rate = 5,
  preCallback?: (count: number) => void,
  postCallback?: (count: number) => void
) => {
  let results: T[] = [];
  const callbackCount = promiseFunctions.length;
  let loopCount = Math.ceil(promiseFunctions.length / rate);
  for (let i = 0; i < loopCount; i++) {
    const parallelCount =
      i === 0 && callbackCount % rate !== 0 ? callbackCount % rate : rate;
    const runCallbacks = promiseFunctions.splice(0, parallelCount);
    if (preCallback) {
      await preCallback(parallelCount);
    }
    const promiseResults = await Promise.all(runCallbacks.map((cb) => cb()));
    results = results.concat(promiseResults);
    if (postCallback) {
      await postCallback(parallelCount);
    }
  }
  return results;
};

const syncFolder = async (
  sourceDir: string,
  bucketName: string,
  settings?: (file: string) => Partial<AWS.S3.PutObjectRequest> | undefined
) => {
  const absolutDir = path.resolve(sourceDir);
  const getFilePaths = async (dir: string, paths: string[]) => {
    for (const name of await readdirAsync(dir)) {
      const filePath = path.join(dir, name);
      const stat = await statAsync(filePath);
      if (stat.isFile()) {
        paths.push(filePath);
      } else if (stat.isDirectory()) {
        await getFilePaths(filePath, paths);
      }
    }
    return paths;
  };
  const filePaths = await getFilePaths(absolutDir, []);

  const getAllS3Objects = async (
    results: AWS.S3.ObjectList = [],
    param: AWS.S3.Types.ListObjectsV2Request = {
      Bucket: bucketName,
    }
  ): Promise<AWS.S3.ObjectList> => {
    const objects = await S3_CLIENT.listObjectsV2(param).promise();
    if (objects.Contents) {
      results = results.concat(objects.Contents);
    }
    if (objects.IsTruncated) {
      return await getAllS3Objects(results, {
        Bucket: bucketName,
        ContinuationToken: objects.NextContinuationToken,
      });
    }
    return results;
  };

  const s3Objects = await getAllS3Objects();
  const oldKeys = s3Objects.map((item) => item.Key!);

  const newKeys = new Set<string>();

  const uploadFunctions = filePaths.map((filePath) => async () => {
    const key = filePath.split(`${absolutDir}/`)[1];
    const body = (await readFileAsync(filePath, null)) as Buffer;
    console.log(`Copying: ${path.basename(key)}`);

    newKeys.add(key);

    return await S3_CLIENT.putObject({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: mime.lookup(key) || "application/octet-stream",
      ...(settings && settings(key)),
    }).promise();
  });
  await rateLimitedPromiseAll(uploadFunctions);

  const deleteList = oldKeys
    .filter((key) => !newKeys.has(key))
    .map((key) => ({ Key: key }));

  if (deleteList.length > 0) {
    console.log("Deleteing old objects");
    await S3_CLIENT.deleteObjects({
      Bucket: bucketName,
      Delete: {
        Objects: deleteList,
      },
    }).promise();
  }
};

const getOutputValues = async () => {
  const outputJson = (await readFileAsync("outputs.json")).toString();
  const rootStackOutputs = JSON.parse(outputJson);

  const outputs: Record<string, string> = {};
  Object.values(rootStackOutputs).forEach((stackOutputs: any) => {
    for (const key in stackOutputs) {
      outputs[key] = stackOutputs[key];
    }
  });
  return outputs;
};

const build = (env: Record<string, string>) => {
  try {
    const buildOutput = execSync("yarn build", {
      cwd: FRONTEND_DIR,
      env: {
        ...process.env,
        ...env,
      },
    });
    process.stdout.write(buildOutput);
  } catch (error) {
    throw Error("Failed to build frontend!");
  }
};

(async () => {
  console.log("Collecting stack output values...");
  const outputValues = await getOutputValues();

  console.log("Building frontend... please wait...");
  build({
    REACT_APP_SIGN_IN_URL_USER: outputValues["SignInUrlUserOutput"],
    REACT_APP_SIGN_IN_URL_ADMIN: outputValues["SignInUrlAdminOutput"],
    REACT_APP_API_BASE_URL: outputValues["ApiUrlOutput"],
  });

  console.log("Syncing s3 files...");
  await syncFolder(
    path.join(FRONTEND_DIR, "build"),
    outputValues["FrontendBucketOutput"],
    (path: string) =>
      (path === "index.html" && {
        CacheControl: "no-cache",
      }) ||
      undefined
  );
  console.log(`Deploy successful: ${outputValues["CloudfrontUrlOutput"]}`);
})().catch(console.error);
