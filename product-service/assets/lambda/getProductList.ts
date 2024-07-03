import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { makeJsonResponse } from "./common/makeResponse";
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

export const handler: Handler<APIGatewayProxyEventV2> = async (event) => {
  try {
    logRequest(event);

    const { productsTableName, stocksTableName } = tablesConf();

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
    const err = e instanceof Error ? e : new Error("Unknown processing error");
    console.error(err.message);
    return Err(500, err.message);
  }
};
