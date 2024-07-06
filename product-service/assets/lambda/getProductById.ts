import {
  DynamoDBClient,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  BatchGetCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { fallbackCatchError, makeJsonResponse } from "./common/makeResponse";
import { tableEnv } from "./common/env";
import { logRequest } from "./common/logRequest";
import { Product, Stock } from "./common/schemas";

const { Ok, Err } = makeJsonResponse({
  defaultHeaders: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
  },
});

const unwrapItem = <T extends Record<string, unknown>>(
  batchOutput: BatchGetCommandOutput,
  tableName: string
) => {
  const tableData = batchOutput.Responses?.[tableName].at(0);
  if (!tableData) {
    throw new Error("Unable retrieve Items after BatchGetItemCommand");
  }
  return tableData as T;
};

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    logRequest(event);

    const productId = event.pathParameters?.productId;

    if (!productId) {
      return Err(404, "Resource pathParameter 'productId' is required");
    }

    const { productsTableName, stocksTableName } = tableEnv();

    const batchGetItemOutput = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [productsTableName]: {
            Keys: [{ id: productId }],
          },
          [stocksTableName]: {
            Keys: [{ product_id: productId }],
          },
        },
      })
    );

    const product = unwrapItem<Product>(batchGetItemOutput, productsTableName);
    const stock = unwrapItem<Stock>(batchGetItemOutput, stocksTableName);

    const joinedData = { ...product, ...stock, product_id: undefined };
    delete joinedData.product_id;

    return Ok(200, joinedData);
  } catch (e) {
    if (e instanceof ResourceNotFoundException) {
      return Err(400, e.message);
    }
    return fallbackCatchError(Err, e);
  }
};
