import * as cdk from "aws-cdk-lib";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as apigatewayv2Authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { CfnImport } from "../constants";

interface Props {
  authorizer: boolean;
  routes: {
    import: lambda.Function;
  };
}

export class ImportServiceApi {
  public readonly httpApi: apigatewayv2.HttpApi;

  constructor(scope: Construct, props: Props) {
    const { authorizer, routes } = props;

    const lambdaBasicAuthorizer =
      lambdaNode.NodejsFunction.fromFunctionAttributes(
        scope,
        "LambdaBasicAuthorizer",
        {
          functionArn: cdk.Fn.importValue(CfnImport.BASIC_AUTHORIZER),
          sameEnvironment: true, // Allows to change permissions for a lambda from another stack
        }
      );

    const apiGatewayAuthorizer =
      new apigatewayv2Authorizers.HttpLambdaAuthorizer(
        "ImportServiceApiAuthorizer",
        lambdaBasicAuthorizer,
        {
          identitySource: ["$request.header.Authorization"],
          responseTypes: [
            apigatewayv2Authorizers.HttpLambdaResponseType.SIMPLE,
          ],
        }
      );

    const apiGateway = new apigatewayv2.HttpApi(scope, "ImportServiceApi", {
      createDefaultStage: true,
      corsPreflight: {
        allowCredentials: true,
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: [apigatewayv2.CorsHttpMethod.GET],
        allowOrigins: [cdk.Fn.importValue(CfnImport.FRONTEND_ORIGIN)],
        maxAge: cdk.Duration.days(1),
      },
      defaultAuthorizer: authorizer ? apiGatewayAuthorizer : undefined,
    });

    apiGateway.addRoutes({
      path: "/import",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2Integrations.HttpLambdaIntegration(
        routes.import.node.id + "Integration",
        routes.import
      ),
    });

    this.httpApi = apiGateway;
  }
}
