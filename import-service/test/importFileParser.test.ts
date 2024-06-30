import { createReadStream } from "fs";
import { handler as importFileParser } from "../assets/lambda/importFileParser";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Context, S3CreateEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { sdkStreamMixin } from "@smithy/util-stream";
import productsJson from "../mock/products/products.csv-parsed.json";

import "aws-sdk-client-mock-jest";

const consoleSpy = jest.spyOn(console, "log").mockImplementation();

const s3Mock = mockClient(S3Client);

const BUCKET_NAME = "bucket-name";
const SRC_FILE_KEY = "uploaded/products.csv";
const DST_FILE_KEY = "parsed/products.csv";

describe("Lambda importFileParser test group", () => {
  beforeAll(() => {
    const stream = createReadStream("./mock/products/products.csv");
    s3Mock.on(GetObjectCommand).resolves({ Body: sdkStreamMixin(stream) });
    s3Mock.on(CopyObjectCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});
  });

  afterEach(() => {
    jest.clearAllMocks();
    s3Mock.resetHistory();
  });

  const event = {
    Records: [
      {
        s3: {
          bucket: { name: BUCKET_NAME },
          object: { key: SRC_FILE_KEY },
        },
      },
    ],
  } as S3CreateEvent;

  /**
   * WARNING. Breakable test case
   */
  test("Print records as they are using console.log", async () => {
    await importFileParser(event, {} as Context, () => {});
    for (let i = 0; i < productsJson.length; i++) {
      const productRecord = productsJson[i];
      const call = consoleSpy.mock.calls[i];
      expect(call).toContainEqual(expect.objectContaining(productRecord));
    }
  });

  test("Array with Object Containing", () => {
    expect([
      { a: 1, b: 2 },
      { c: 1, d: 1 },
    ]).toContainEqual(expect.objectContaining({ a: 1, b: expect.anything() }));
  });

  /**
   * WARNING. Breakable test case
   */
  test("Put/Delete commands have been called", async () => {
    await importFileParser(event, {} as Context, () => {});
    expect(s3Mock).toHaveReceivedCommandTimes(CopyObjectCommand, 1);
    expect(s3Mock).toHaveReceivedCommandTimes(DeleteObjectCommand, 1);
  });

  /**
   * WARNING. Breakable test case
   */
  test("Put/Delete (move) file from 'uploaded/' to 'parsed/'", async () => {
    await importFileParser(event, {} as Context, () => {});
    expect(s3Mock).toHaveReceivedCommandWith(CopyObjectCommand, {
      CopySource: `/${BUCKET_NAME}/${SRC_FILE_KEY}`,
      Bucket: BUCKET_NAME,
      Key: DST_FILE_KEY,
    });
    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, {
      Bucket: BUCKET_NAME,
      Key: SRC_FILE_KEY,
    });
  });
});
