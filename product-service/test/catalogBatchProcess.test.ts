import { invokeSqsEvent } from "./common/invokeEvent";
import { SQSEvent } from "aws-lambda";
import { handler as catalogBatchProcess } from "../assets/lambda/catalogBatchProcess";
import { mockClient } from "aws-sdk-client-mock";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import {
  createProductsWithId,
  totalPrice as expectedTotalPrice,
  totalCount as expectedTotalCount,
} from "../mock/create-products-with-id.data";

import "aws-sdk-client-mock-jest";

const ddbMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

const PRODUCT_TABLE_NAME = "PRODUCT_TABLE_NAME";
const STOCK_TABLE_NAME = "STOCK_TABLE_NAME";
const SNS_TOPIC_ARN = "SNS_TOPIC_ARN";

const createSqsEvent = <T extends Record<string, unknown>>(dataArray: T[]) => {
  return {
    Records: dataArray.map((record) => ({
      body: JSON.stringify(record),
    })),
  } as SQSEvent;
};

describe("Lambda importFileParser test group", () => {
  beforeAll(() => {
    ddbMock.on(BatchWriteCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});
  });

  beforeEach(() => {
    process.env = { PRODUCT_TABLE_NAME, STOCK_TABLE_NAME, SNS_TOPIC_ARN };
  });

  afterEach(() => {
    jest.clearAllMocks();
    ddbMock.resetHistory();
    snsMock.resetHistory();
  });

  describe("Skip message publishing for invalid event record", () => {
    const validProduct = createProductsWithId[0];
    test("record.count is not an integer", async () => {
      const productWithInvalidPrice = { ...validProduct, count: 14.5 };
      const sqsEvent = createSqsEvent([productWithInvalidPrice]);
      await invokeSqsEvent(catalogBatchProcess)(sqsEvent);

      expect(ddbMock).not.toHaveReceivedCommand(BatchWriteCommand);
      expect(snsMock).not.toHaveReceivedCommand(PublishCommand);
    });
    // ...
  });

  test("BatchWriteCommand has been called with right arguments", async () => {
    const sqsEvent = createSqsEvent(createProductsWithId);
    await invokeSqsEvent(catalogBatchProcess)(sqsEvent);

    expect(ddbMock).toHaveReceivedCommandWith(BatchWriteCommand, {
      RequestItems: {
        [PRODUCT_TABLE_NAME]: createProductsWithId.map(
          ({ product_id, title, description, price }) => ({
            PutRequest: {
              Item: {
                id: product_id,
                title,
                description,
                price,
              },
            },
          })
        ),
        [STOCK_TABLE_NAME]: createProductsWithId.map(
          ({ product_id, count }) => ({
            PutRequest: {
              Item: {
                product_id,
                count,
              },
            },
          })
        ),
      },
    });
  });

  test("SNS message has been sent with right attributes", async () => {
    const sqsEvent = createSqsEvent(createProductsWithId);
    await invokeSqsEvent(catalogBatchProcess)(sqsEvent);

    expect(snsMock).toHaveReceivedCommand(PublishCommand);
    const lastPublishCall = snsMock.commandCalls(PublishCommand).at(0)!;
    const msgAttributes = lastPublishCall.args[0].input.MessageAttributes!;
    expect(msgAttributes.totalPrice).toMatchObject({
      DataType: "Number",
      StringValue: String(expectedTotalPrice),
    });
    expect(msgAttributes.totalCount).toMatchObject({
      DataType: "Number",
      StringValue: String(expectedTotalCount),
    });
  });
});
