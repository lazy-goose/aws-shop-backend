import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
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

const unwrapItems = <T extends Record<string, unknown>[]>(outputWithItems: {
  Items?: Record<string, any>[];
}) => {
  const Items = outputWithItems.Items;
  if (!Items) {
    throw new Error("Unable to retrieve Items after ScanCommand");
  }
  return Items as T;
};

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    logRequest(event);

    const { productsTableName, stocksTableName } = tableEnv();

    const SCAN_LIMIT = 25;
    const [scanProductsOutput, scanStocksOutput] = await Promise.all([
      docClient.send(
        new ScanCommand({
          TableName: productsTableName,
          Limit: SCAN_LIMIT,
        })
      ),
      docClient.send(
        new ScanCommand({
          TableName: stocksTableName,
          Limit: SCAN_LIMIT,
        })
      ),
    ]);

    const products = unwrapItems<Product[]>(scanProductsOutput);
    const stocks = unwrapItems<Stock[]>(scanStocksOutput);

    const joinedData = products.map((product) => {
      const stock = stocks.find((stock) => stock.product_id === product.id);
      const data = {
        ...product,
        ...stock,
      };
      delete data.product_id;
      return data;
    });

    return Ok(200, joinedData);
  } catch (e) {
    return fallbackCatchError(Err, e);
  }
};
