import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayIntegrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tableBaseConfiguration = {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: false,
      billing: dynamodb.Billing.provisioned({
        readCapacity: dynamodb.Capacity.fixed(5),
        writeCapacity: dynamodb.Capacity.autoscaled({ maxCapacity: 15 }),
      }),
    } satisfies Omit<dynamodb.TablePropsV2, "partitionKey">;

    const productTable = new dynamodb.TableV2(this, "ProductDynamodbTable", {
      ...tableBaseConfiguration,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });

    const stockTable = new dynamodb.TableV2(this, "StockDynamodbTable", {
      ...tableBaseConfiguration,
      partitionKey: { name: "product_id", type: dynamodb.AttributeType.STRING },
    });

    const apiGateway = new apigateway.HttpApi(this, "ProductServiceApi", {
      apiName: "Product Service",
    });

    const lambdaGetProductList = new lambdaNode.NodejsFunction(
      this,
      "LambdaGetProductList",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: "assets/lambda/getProductList.ts",
        handler: "handler",
      }
    );

    const lambdaGetProductById = new lambdaNode.NodejsFunction(
      this,
      "LambdaGetProductById",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: "assets/lambda/getProductById.ts",
        handler: "handler",
      }
    );

    apiGateway.addRoutes({
      path: "/products",
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        lambdaGetProductList.node.id + "Integration",
        lambdaGetProductList
      ),
    });

    apiGateway.addRoutes({
      path: "/products/{productId}",
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        lambdaGetProductById.node.id + "Integration",
        lambdaGetProductById
      ),
    });
  }
}
