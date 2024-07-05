import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { SQSHandler } from "aws-lambda";
import { tablesConf } from "./common/tablesConf";
import { SQSCreateProductDto } from "./common/schemas";
import { z } from "zod";

const dynamoDBClient = new DynamoDBClient({});
const dynamoClient = DynamoDBDocumentClient.from(dynamoDBClient);

const parseBody = (record: string): SQSCreateProductDto | null => {
  try {
    return SQSCreateProductDto.parse(JSON.parse(record));
  } catch (e) {
    if (e instanceof z.ZodError) {
      console.error("Schema error:", e.flatten());
    } else {
      console.error("Unable to parse:", record);
    }
    return null;
  }
};

export const handler: SQSHandler = async (event) => {
  const { productsTableName, stocksTableName } = tablesConf();

  const recordsData = event.Records.map((record) => parseBody(record.body));
  const processData = recordsData.filter(
    (d): d is Exclude<typeof d, null> => d !== null
  );

  if (!processData.length) {
    return;
  }

  const batchCommand = new BatchWriteCommand({
    RequestItems: {
      [productsTableName]: processData.map(
        ({ product_id, title, description, price }) => ({
          PutRequest: {
            Item: { id: product_id, title, description, price },
          },
        })
      ),
      [stocksTableName]: processData.map(({ product_id, count }) => ({
        PutRequest: {
          Item: { product_id, count },
        },
      })),
    },
  });

  /* const batchWriteCommandOutput = */ await dynamoClient.send(batchCommand);
};
