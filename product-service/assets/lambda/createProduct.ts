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
import { FALLBACK_PRODUCT_IMAGE_URL } from "../../constants";

const { Ok, Err } = makeJsonResponse();

/**
 * apigatewayv2.HttpApi doesn't support schema validation
 */
const validateProductDto = (value: unknown) => {
  const { success, data, error } = CreateProductDto.safeParse(value, {
    errorMap,
  });
  return success
    ? { ok: true as const, data, error: null }
    : { ok: false as const, data: null, error: error.flatten() };
};

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const generateImageUrl = async (product: CreateProductDto): Promise<string> => {
  return FALLBACK_PRODUCT_IMAGE_URL;
};

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
    const { ok, error, data } = validateProductDto(requestData);
    if (!ok) {
      return Err(400, error);
    }

    const id = randomUUID();
    const { title, description, price, count } = data;

    const imageUrl = await generateImageUrl(data);

    /* const transactWriteItemsOutput = */ await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: productsTableName,
              Item: { id, title, description, price, imageUrl },
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
