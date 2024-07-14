import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { SQSHandler } from "aws-lambda";
import { SQSCreateProductDto } from "./common/schemas";
import { snsEnv, tableEnv } from "./common/env";
import { z } from "zod";

const dynamoDBClient = new DynamoDBClient({});
const dynamoClient = DynamoDBDocumentClient.from(dynamoDBClient);

const snsClient = new SNSClient({});

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

const snsMessage = (products: Record<string, unknown>[]) => {
  const heading = "Products have been created:";
  const records = products.map((p) => `- ${JSON.stringify(p)}`).join("\n");
  return `${heading}\n${records}`;
};

export const handler: SQSHandler = async (event) => {
  const { productsTableName, stocksTableName } = tableEnv();
  const { snsTopicArn } = snsEnv();

  const recordsData = event.Records.map((record) => parseBody(record.body));
  const processData = recordsData.filter(
    (d): d is Exclude<typeof d, null> => d !== null
  );

  if (!processData.length) {
    return;
  }

  const transactionCommands = processData.map(
    ({ product_id, title, description, price, count }) => {
      return new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: productsTableName,
              Item: { id: product_id, title, description, price },
            },
          },
          {
            Put: {
              TableName: stocksTableName,
              Item: { product_id, count },
            },
          },
        ],
      });
    }
  );

  await Promise.allSettled(
    transactionCommands.map((cmd) => dynamoClient.send(cmd))
  );

  console.log("Stage 1. Products have been processed:", processData);

  const Message = snsMessage(processData);
  const publishCommand = new PublishCommand({
    TopicArn: snsTopicArn,
    MessageAttributes: {
      totalPrice: {
        DataType: "Number",
        StringValue: String(processData.reduce((a, v) => a + v.price, 0)),
      },
      totalCount: {
        DataType: "Number",
        StringValue: String(processData.reduce((a, v) => a + v.count, 0)),
      },
    },
    Message,
  });

  await snsClient.send(publishCommand);

  console.log("Stage 2. Message has been sent:", Message);
};
