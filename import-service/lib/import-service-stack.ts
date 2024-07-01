import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayIntegrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import { ImportBucket } from "../constants";
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

    /* Import Products File */

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

    /* File Parser s3 event */

    const lambdaImportFileParser = new lambdaNode.NodejsFunction(
      this,
      "LambdaImportFileParser",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: "assets/lambda/importFileParser.ts",
        environment: {
          BUCKET_NAME: importBucket.bucketName,
        },
      }
    );

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaImportFileParser),
      {
        prefix: ImportBucket.Path.UPLOADED + "/",
        suffix: ".csv",
      }
    );

    importBucket.grantReadWrite(lambdaImportFileParser);
  }
}
