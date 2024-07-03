import {
  DynamoDBClient,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  BatchGetCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { fallbackCatchError, makeJsonResponse } from "./common/makeResponse";
import { logRequest } from "./common/logRequest";
import { Product } from "../../types/product.type";
import { Stock } from "../../types/stock.type";
import { tablesConf } from "./common/tablesConf";

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

export const handler: Handler<APIGatewayProxyEventV2> = async (event) => {
  try {
    logRequest(event);

    const productId = event.pathParameters?.productId;

    if (!productId) {
      throw new Error(
        "Lambda function must be invoked with pathParameter 'productId'"
      );
    }

    const { productsTableName, stocksTableName } = tablesConf();

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
