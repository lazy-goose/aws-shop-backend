import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayIntegrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as constants from "../constants";
import { Construct } from "constructs";

/**
 * Before you deploy `import-service`, be sure to deploy `product-service`.
 * The `product-service.output.json` file will be generated containing ARN for CatalogItemsQueue.
 * This Arn is used by ImportServiceStack to grant permission to send messages from importFileParser lambda.
 */
import productServiceOutput from "../../product-service/product-service.output.json";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = new s3.Bucket(this, "ImportBucket", {
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedHeaders: ["Content-Type"],
          allowedOrigins: ["*"],
        },
      ],
    });

    new cdk.CfnOutput(this, "ImportBucketName", {
      value: importBucket.bucketName,
    });

    /* Import .csv file into s3 bucket */

    const lambdaImportProductsFile = new lambdaNode.NodejsFunction(
      this,
      "LambdaImportProductsFile",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: "assets/lambda/importProductsFile.ts",
        environment: {
          BUCKET_NAME: importBucket.bucketName,
        },
      }
    );

    const apiGateway = new apigatewayv2.HttpApi(this, "ImportServiceApi", {
      createDefaultStage: true,
    });

    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: apiGateway.url || "DISABLED",
    });

    apiGateway.addRoutes({
      path: "/import",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        lambdaImportProductsFile.node.id + "Integration",
        lambdaImportProductsFile
      ),
    });

    importBucket.grantReadWrite(lambdaImportProductsFile);

    /* Parse .csv and send messages to CatalogItemsQueue */

    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      "CatalogItemsQueue",
      productServiceOutput.ImportProductStack.CatalogItemsQueueArn
    );

    const lambdaImportFileParser = new lambdaNode.NodejsFunction(
      this,
      "LambdaImportFileParser",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: "assets/lambda/importFileParser.ts",
        environment: {
          BUCKET_NAME: importBucket.bucketName,
          SQS_URL: catalogItemsQueue.queueUrl,
        },
      }
    );

    catalogItemsQueue.grantSendMessages(lambdaImportFileParser);

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaImportFileParser),
      {
        prefix: constants.ImportBucket.Path.UPLOADED + "/",
        suffix: ".csv",
      }
    );

    importBucket.grantReadWrite(lambdaImportFileParser);
  }
}
