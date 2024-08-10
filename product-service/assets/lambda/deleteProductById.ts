import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { fallbackCatchError, makeJsonResponse } from "./common/makeResponse";
import { tableEnv } from "./common/env";
import { logRequest } from "./common/logRequest";

const { Ok, Err } = makeJsonResponse();

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

    /* const transactWriteItemsOutput = */ await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: productsTableName,
              Key: { id: productId },
            },
          },
          {
            Delete: {
              TableName: stocksTableName,
              Key: { product_id: productId },
            },
          },
        ],
      })
    );

    return Ok(200, true);
  } catch (e) {
    return fallbackCatchError(Err, e);
  }
};
