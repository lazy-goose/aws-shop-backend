import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2, Handler } from "aws-lambda";
import { fallbackCatchError, makeJsonResponse } from "./common/makeResponse";
import { logRequest } from "./common/logRequest";
import { tablesConf } from "./common/tablesConf";
import { randomUUID } from "crypto";

const { Ok, Err } = makeJsonResponse({
  defaultHeaders: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
  },
});

/**
 * apigatewayv2.HttpApi doesn't support schema validation
 */
const matchCreateProductDTO = (
  data: unknown
): data is {
  title: string;
  description: string;
  price: number;
  count: number;
} => {
  // prettier-ignore
  return (
    typeof data === 'object' && data !== null &&
    /*1*/ "title" in data && typeof data.title === "string" && data.title.length >= 1 &&
    /*2*/ "description" in data && typeof data.description === "string" &&
    /*3*/ "price" in data && typeof data.price === "number" &&
    /*4*/ "count" in data && Number.isInteger(data.count) &&
    Object.keys(data).length === 4
  );
};

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: Handler<APIGatewayProxyEventV2> = async (event) => {
  try {
    logRequest(event);

    const { productsTableName, stocksTableName } = tablesConf();

    const errorResponse = Err(400, "Invalid request data");
    let requestData: Record<string, unknown>;
    try {
      // @ts-expect-error
      requestData = JSON.parse(event.body);
    } catch {
      return errorResponse;
    }
    if (!matchCreateProductDTO(requestData)) {
      return errorResponse;
    }

    const id = randomUUID();
    const { title, description, price, count } = requestData;

    /* const transactWriteItemsOutput = */ await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: productsTableName,
              Item: { id, title, description, price },
            },
          },
          {
            Put: {
              TableName: stocksTableName,
              Item: { product_id: id, count },
            },
          },
        ],
      })
    );

    return Ok(200, { id, ...requestData });
  } catch (e) {
    return fallbackCatchError(Err, e);
  }
};
