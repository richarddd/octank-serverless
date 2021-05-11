import * as ec2 from "@aws-cdk/aws-ec2";
import * as rds from "@aws-cdk/aws-rds";
import * as secretsmanager from "@aws-cdk/aws-secretsmanager";
import * as ssm from "@aws-cdk/aws-ssm";
import * as cdk from "@aws-cdk/core";
import * as utils from "./utils";

type Props = cdk.StackProps &
  utils.StagedStackProps & {
    vpc: ec2.Vpc;
  };

export default class DatabaseStack extends cdk.Stack {
  readonly databaseCredentialsArnParameterName: string;
  readonly databaseArnParameterName: string;
  readonly databaseClusterArn: string;
  readonly databaseCredentialsSecret: secretsmanager.Secret;

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);
    const { vpc, stage, serviceName } = props;

    this.databaseCredentialsArnParameterName = `${serviceName}-credentials-arn-${stage}`;
    this.databaseArnParameterName = `${serviceName}-db-arn-${stage}`;

    const databaseUsername = `masteruser`;

    const databaseCredentialsSecret = new secretsmanager.Secret(
      this,
      "DBCredentialsSecret",
      {
        secretName: `${serviceName}-credentials-${stage}`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: databaseUsername,
          }),
          excludePunctuation: true,
          includeSpace: false,
          generateStringKey: "password",
        },
      }
    );

    new ssm.StringParameter(this, "DBCredentialsArn", {
      parameterName: this.databaseCredentialsArnParameterName,
      stringValue: databaseCredentialsSecret.secretArn,
    });

    // get subnetids from vpc
    const subnetIds: string[] = vpc.isolatedSubnets.map(
      (subnet) => subnet.subnetId
    );

    // create subnetgroup
    const dbSubnetGroup: rds.CfnDBSubnetGroup = new rds.CfnDBSubnetGroup(
      this,
      "AuroraSubnetGroup",
      {
        dbSubnetGroupDescription: "Subnet group to access aurora",
        dbSubnetGroupName: `${serviceName}-aurora-sls-subnet-group-${stage}`,
        subnetIds,
      }
    );

    const isDev = stage !== "prod";

    const databaseCluster = new rds.CfnDBCluster(this, "DBCluster", {
      dbClusterIdentifier: `${serviceName}-cluster-${stage}`,
      engineMode: "serverless",
      engine: "aurora-mysql",
      enableHttpEndpoint: true,
      databaseName: "main",
      dbSubnetGroupName: dbSubnetGroup.dbSubnetGroupName,
      masterUsername: databaseCredentialsSecret
        .secretValueFromJson("username")
        .toString(),
      masterUserPassword: databaseCredentialsSecret
        .secretValueFromJson("password")
        .toString(),
      backupRetentionPeriod: isDev ? 1 : 30,
      scalingConfiguration: {
        autoPause: true,
        maxCapacity: isDev ? 1 : 2,
        minCapacity: 1,
        secondsUntilAutoPause: isDev ? 3600 : 10800,
      },
      deletionProtection: isDev ? false : true,
    });

    databaseCluster.addDependsOn(dbSubnetGroup);

    const dbClusterArn = `arn:aws:rds:${this.region}:${this.account}:cluster:${databaseCluster.ref}`;

    new ssm.StringParameter(this, "DBResourceArn", {
      parameterName: this.databaseArnParameterName,
      stringValue: dbClusterArn,
    });

    this.databaseClusterArn = dbClusterArn;
    this.databaseCredentialsSecret = databaseCredentialsSecret;
  }
}
