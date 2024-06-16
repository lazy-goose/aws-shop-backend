import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const apiGateway = new apigateway.RestApi(this, "ProductServiceApi", {
      restApiName: "Product Service",
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

    /* Resource: /products */
    const productsResource = apiGateway.root.addResource("products");
    productsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(lambdaGetProductList)
    );

    /* Resource: /products/{productId} */
    const productByIdResource = productsResource.addResource("{productId}");
    productByIdResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(lambdaGetProductById)
    );
  }
}
