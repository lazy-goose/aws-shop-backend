import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayIntegrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new cdk.CfnOutput(this, "DefaultRegion", {
      value: process.env.CDK_DEFAULT_REGION!,
    });

    /* Dynamodb */

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

    new cdk.CfnOutput(this, "ProductTableName", {
      value: productTable.tableName,
    });

    new cdk.CfnOutput(this, "StockTableName", {
      value: stockTable.tableName,
    });

    /* Lambda */

    const baseEnvironment = {
      PRODUCT_TABLE_NAME: productTable.tableName,
      STOCK_TABLE_NAME: stockTable.tableName,
    };

    const lambdaGetProductList = new lambdaNode.NodejsFunction(
      this,
      "LambdaGetProductList",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: "assets/lambda/getProductList.ts",
        handler: "handler",
        environment: {
          ...baseEnvironment,
        },
      }
    );

    const lambdaCreateProduct = new lambdaNode.NodejsFunction(
      this,
      "LambdaCreateProduct",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: "assets/lambda/createProduct.ts",
        handler: "handler",
        environment: {
          ...baseEnvironment,
        },
      }
    );

    const lambdaGetProductById = new lambdaNode.NodejsFunction(
      this,
      "LambdaGetProductById",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: "assets/lambda/getProductById.ts",
        handler: "handler",
        environment: {
          ...baseEnvironment,
        },
      }
    );

    /* API Gateway */

    const apiGateway = new apigatewayv2.HttpApi(this, "ProductServiceApi", {
      apiName: "Product Service",
      createDefaultStage: true,
      corsPreflight: {
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.HEAD,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ["*"],
        maxAge: cdk.Duration.days(1),
      },
    });

    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: apiGateway.url || "DISABLED",
    });

    apiGateway.addRoutes({
      path: "/products",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        lambdaGetProductList.node.id + "Integration",
        lambdaGetProductList
      ),
    });

    apiGateway.addRoutes({
      path: "/products",
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        lambdaCreateProduct.node.id + "Integration",
        lambdaCreateProduct
      ),
    });

    apiGateway.addRoutes({
      path: "/products/{productId}",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        lambdaGetProductById.node.id + "Integration",
        lambdaGetProductById
      ),
    });

    productTable.grantReadWriteData(lambdaGetProductList);
    productTable.grantReadWriteData(lambdaCreateProduct);
    productTable.grantReadWriteData(lambdaGetProductById);

    stockTable.grantReadWriteData(lambdaGetProductList);
    stockTable.grantReadWriteData(lambdaCreateProduct);
    stockTable.grantReadWriteData(lambdaGetProductById);
  }
}
