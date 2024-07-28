import * as cdk from "aws-cdk-lib";
import * as awsLogs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as apigatewayv2Authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { CfnImport } from "../constants";

interface Props {
  authorizer: boolean;
  accessLogs: boolean;
  routes: {
    import: lambda.Function;
  };
}

export class ImportServiceApi {
  public readonly httpApi: apigatewayv2.HttpApi;

  constructor(scope: Construct, props: Props) {
    const { authorizer, accessLogs, routes } = props;

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

    if (accessLogs) {
      this.enableAccessLogs(apiGateway);
    }

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

  /**
   * https://www.kevinwmcconnell.com/cdk/http-api-logs-with-cdk
   */
  private enableAccessLogs(api = this.httpApi) {
    const cfnStage = api.defaultStage!.node
      .defaultChild as apigatewayv2.CfnStage;
    const logGroup = new awsLogs.LogGroup(api, "ImportServiceApiAccessLogs", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cfnStage.accessLogSettings = {
      destinationArn: logGroup.logGroupArn,
      format: JSON.stringify({
        requestId: "$context.requestId",
        sourceIp: "$context.identity.sourceIp",
        httpMethod: "$context.httpMethod",
        path: "$context.path",
        status: "$context.status",
        userAgent: "$context.identity.userAgent",
        requestTime: "$context.requestTime",
        responseLength: "$context.responseLength",
        authorizerError: "$context.authorizer.error",
      }),
    };
    logGroup.grantWrite(new iam.ServicePrincipal("apigateway.amazonaws.com"));
  }
}
