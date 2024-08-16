import * as cdk from "aws-cdk-lib";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";

import { env } from "./share/import-env";

const joinUrl = (base: string, url: string) => {
  return decodeURI(new URL(url, base).href);
};

export class BffServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const Env = env("BEANSTALK_URL");

    /* API Gateway */

    const apigateway = new apigatewayv2.HttpApi(this, "BffServiceApi", {
      createDefaultStage: true,
    });

    apigateway.addRoutes({
      path: "/{proxy+}",
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: new apigatewayv2Integrations.HttpUrlIntegration(
        "BffApiHttpUrlIntegration",
        joinUrl(Env.BEANSTALK_URL, "/{proxy}")
      ),
    });

    new cdk.CfnOutput(this, "BffApiUrl", {
      value: apigateway.url || "",
      exportName: "BffApiUrl",
    });
  }
}
