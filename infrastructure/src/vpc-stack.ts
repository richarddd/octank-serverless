import * as ec2 from "@aws-cdk/aws-ec2";
import * as cdk from "@aws-cdk/core";
import { Stage } from "./utils";

export type VpcStackProps = cdk.StackProps & {
  stage: Stage;
};

export class VpcStack extends cdk.Stack {
  readonly vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    const { stage } = props;

    const maxAzs = (stage === "dev" && 2) || 3;

    const cidr = "10.0.0.0/16";

    this.vpc = new ec2.Vpc(this, "VPC", {
      cidr,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "ingress",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 28,
          name: "rds",
          subnetType: ec2.SubnetType.ISOLATED,
        },
      ],
      maxAzs,
    });
  }
}
