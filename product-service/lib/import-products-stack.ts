import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sqsSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface ImportProductsStackProps extends cdk.StackProps {
  productTable: dynamodb.TableV2;
  stockTable: dynamodb.TableV2;
}

export class ImportProductsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportProductsStackProps) {
    super(scope, id, props);

    const { productTable, stockTable } = props;

    /* Queue */

    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      encryption: sqs.QueueEncryption.UNENCRYPTED,
    });

    /* Lambda */

    const DYNAMODB_ENVIRONMENT = {
      PRODUCT_TABLE_NAME: productTable.tableName,
      STOCK_TABLE_NAME: stockTable.tableName,
    };

    const lambdaCatalogBatchProcess = new lambdaNode.NodejsFunction(
      this,
      "LambdaCatalogBatchProcess",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: "assets/lambda/catalogBatchProcess.ts",
        environment: {
          ...DYNAMODB_ENVIRONMENT,
        },
      }
    );

    lambdaCatalogBatchProcess.addEventSource(
      new sqsSources.SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
        maxBatchingWindow: cdk.Duration.seconds(5),
      })
    );

    productTable.grantReadWriteData(lambdaCatalogBatchProcess);
    stockTable.grantReadWriteData(lambdaCatalogBatchProcess);
  }
}
