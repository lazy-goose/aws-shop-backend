import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as constants from "../constants";
import { ImportServiceApi } from "./import-service-api";
import { Construct } from "constructs";

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

    importBucket.grantReadWrite(lambdaImportProductsFile);

    const importServiceApi = new ImportServiceApi(this, {
      authorizer: true,
      routes: {
        import: lambdaImportProductsFile,
      },
    });

    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: importServiceApi.httpApi.url || "DISABLED",
    });

    /* Parse .csv and send messages to CatalogItemsQueue */

    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      "CatalogItemsQueue",
      cdk.Fn.importValue("CatalogItemsQueueArn")
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
