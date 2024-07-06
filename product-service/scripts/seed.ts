import fs from "fs/promises";
import { fromIni } from "@aws-sdk/credential-providers";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { products, stocks } from "../mock/product.data";
import { ProductServiceStack } from "../lib/product-service-stack";

const parseCfnOutputFile = async () => {
  const cfnOutputFilePath = "product-service.output.json";

  let cfnOutputUtfData: string;
  try {
    cfnOutputUtfData = await fs.readFile(cfnOutputFilePath, {
      encoding: "utf-8",
    });
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      console.error(
        `No file '${cfnOutputFilePath}'. Try to run 'npm run deploy' before running the script`
      );
    }
    process.exit(1);
  }

  let cfnOutputData: Record<string, unknown>;
  try {
    cfnOutputData = JSON.parse(cfnOutputUtfData);
  } catch (_) {
    console.error(`Unable to parse '${cfnOutputFilePath}'`);
    process.exit(1);
  }

  const stackName = ProductServiceStack.name;

  // @ts-expect-error
  const productTable = cfnOutputData[stackName].ProductTableName;
  // @ts-expect-error
  const stockTable = cfnOutputData[stackName].StockTableName;

  return {
    productTable,
    stockTable,
  };
};

/**
 * Destructive operation. Command will overwrite items with the same keys
 */
(async function seed() {
  const { productTable, stockTable } = await parseCfnOutputFile();

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
