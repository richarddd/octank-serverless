import { Connection, createConnection } from "typeorm";
import { BaseConnectionOptions } from "typeorm/connection/BaseConnectionOptions";
import { AuroraDataApiConnectionOptions } from "typeorm/driver/aurora-data-api/AuroraDataApiConnectionOptions";
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";
import Document from "./entities/Document";

const IS_LOCAL = process.env.IS_LOCAL;

const entities: BaseConnectionOptions["entities"] = [Document];

const connectionOptions:
  | AuroraDataApiConnectionOptions
  | MysqlConnectionOptions = (IS_LOCAL && {
  type: "mysql",
  database: "main",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "",
  synchronize: true,
  logging: false,
  entities,
}) || {
  type: "aurora-data-api",
  database: "main",
  synchronize: true,
  secretArn: process.env.DATABASE_SECRET_ARN!,
  resourceArn: process.env.DATABASE_CLUSTER_ARN!,
  region: process.env.AWS_REGION!,
  entities,
};

const sleep = (timeout: number) =>
  new Promise((res) => setTimeout(res, timeout));

console.log(`Connecting to ${(IS_LOCAL && "local") || "aurora"} database...`);
const now = new Date().getTime();

const createConnectionWithRetry: (attempt?: number) => Promise<Connection> = (
  attempt = 1
) =>
  createConnection(connectionOptions).catch(async (e) => {
    if (attempt < 4 && e.retryable) {
      await sleep(attempt * 2000);
      return createConnectionWithRetry(attempt + 1);
    }
    throw e;
  });

export const createDatabaseConnection = () =>
  createConnectionWithRetry().then((connection) => {
    console.log(`Connection established in ${new Date().getTime() - now}ms`);
    return connection;
  });
