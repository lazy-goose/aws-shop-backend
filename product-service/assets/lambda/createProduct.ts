import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { fallbackCatchError, makeJsonResponse } from "./common/makeResponse";
import { tableEnv } from "./common/env";
import { logRequest } from "./common/logRequest";
import { CreateProductDto } from "./common/schemas";
import { errorMap } from "zod-validation-error";
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
const validateProductDto = (value: unknown) => {
  const { success, error } = CreateProductDto.safeParse(value, { errorMap });
  return success ? null : error.flatten();
};

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    logRequest(event);

    const { productsTableName, stocksTableName } = tableEnv();

    const errorResponse = Err(400, "Invalid request data");
    let requestData: Record<string, unknown>;
    try {
      // @ts-expect-error
      requestData = JSON.parse(event.body);
    } catch {
      return errorResponse;
    }
    const validationError = validateProductDto(requestData);
    if (validationError) {
      return Err(400, validationError);
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
