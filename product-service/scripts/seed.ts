import { fromIni } from "@aws-sdk/credential-providers";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { products, stocks } from "../mock/products.data";

/*
 * Run `npm run deploy` before running the script to create the `product-service.output.json` file
 */
import cfnOutput from "../product-service.output.json";

/**
 * Destructive operation. Command will overwrite items with the same keys
 */
(async function seed() {
  const productTable = cfnOutput.ProductServiceStack.ProductTableName;
  const stockTable = cfnOutput.ProductServiceStack.StockTableName;

  const client = new DynamoDBClient({
    credentials: fromIni(),
  });
  const docClient = DynamoDBDocumentClient.from(client);

  const command = new BatchWriteCommand({
    RequestItems: {
      [productTable]: products.map((product) => ({
        PutRequest: { Item: product },
      })),
      [stockTable]: stocks.map((stock) => ({
        PutRequest: { Item: stock },
      })),
    },
  });

  const response = await docClient.send(command);
  console.log(response);
})();
