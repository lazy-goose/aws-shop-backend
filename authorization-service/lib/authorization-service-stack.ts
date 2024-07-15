import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

import "dotenv/config";

const credentialsFromEnv = (...envNames: string[]): string => {
  const credentials = envNames.map((env) => {
    const username = env;
    const password = process.env[username]?.trimEnd();
    if (!password) {
      throw new Error(
        `Wrong cdk environment. Variable 'process.env[${username}'] is undefined`
      );
    }
    return [username, password];
  });
  return credentials.map((cred) => cred.join("=")).join(":");
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
          CREDENTIALS: credentialsFromEnv("lazy-goose"),
        },
      }
    );

    new cdk.CfnOutput(this, "LambdaBasicAuthorizerArn", {
      value: lambdaBasicAuthorizer.functionArn,
      exportName: "LambdaBasicAuthorizerArn",
    });
  }
}
