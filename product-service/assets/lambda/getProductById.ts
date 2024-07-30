import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { fallbackCatchError, makeJsonResponse } from "./common/makeResponse";
import { tableEnv } from "./common/env";
import { logRequest } from "./common/logRequest";

const { Ok, Err } = makeJsonResponse({
  defaultHeaders: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
  },
});

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

    console.log(JSON.stringify(batchGetItemOutput));

    const product = batchGetItemOutput.Responses?.[productsTableName]?.[0];
    const stock = batchGetItemOutput.Responses?.[stocksTableName]?.[0];

    if (!product || !stock) {
      return Err(404, "Not found");
    }

    const { product_id: _, ...stockData } = stock;
    const joinedData = { ...product, ...stockData };

    return Ok(200, joinedData);
  } catch (e) {
    return fallbackCatchError(Err, e);
  }
};
