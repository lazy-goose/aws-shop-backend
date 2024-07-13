import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

import "dotenv/config";

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const USERNAME = "lazy-goose";
    const PASSWORD = process.env[USERNAME];

    if (!PASSWORD) {
      throw new Error(
        `Wrong cdk environment. Env variable 'process.env[${USERNAME}'] was not provided`
      );
    }

    new lambdaNode.NodejsFunction(this, "LambdaBasicAuthorizer", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      entry: "assets/lambda/basicAuthorizer.ts",
      environment: {
        CREDENTIALS: `${USERNAME}=${PASSWORD}`,
      },
    });
  }
}
