import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

import "dotenv/config";

const env = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Wrong cdk environment. Variable 'process.env[${name}'] is undefined`
    );
  }
  return value;
};

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaBasicAuthorizer = new lambdaNode.NodejsFunction(
      this,
      "LambdaBasicAuthorizer",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: "assets/lambda/basicAuthorizer.ts",
        environment: {
          CREDENTIALS: env("CREDENTIALS"),
        },
      }
    );

    new cdk.CfnOutput(this, "LambdaBasicAuthorizerArn", {
      value: lambdaBasicAuthorizer.functionArn,
      exportName: "LambdaBasicAuthorizerArn",
    });
  }
}
