export {};

declare global {
  const __TYPEORM_ENTITIES: Function[];

  interface Window {}
  namespace NodeJS {
    interface Process {
      DATABASE_SECRET_ARN: string;
      DATABASE_CLUSTER_ARN: string;
      AWS_REGION: string;
      IS_LOCAL: string;
    }
  }
}
