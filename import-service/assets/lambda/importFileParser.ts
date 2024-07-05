import { pipeline } from "stream/promises";
import { ImportBucket, CatalogItemsQueue } from "../../constants";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { S3Handler } from "aws-lambda";
import { NodeJsClient } from "@smithy/types";
import { CreateProductCsv } from "./common/schemas";
import { errorMap } from "zod-validation-error";
import csv from "csv-parser";

/**
 * Resolves type for Readable stream:
 * https://stackoverflow.com/questions/76142043/getting-a-readable-from-getobject-in-aws-s3-sdk-v3
 */
const s3Client = new S3Client() as NodeJsClient<S3Client>;

const getS3ObjectReadStream = async (input: GetObjectCommandInput) => {
  const response = await s3Client.send(new GetObjectCommand(input));
  const readStream = response.Body;
  if (!readStream) {
    throw new Error("Unable to get s3 object stream");
  }
  return readStream;
};

const moveObjectInS3Bucket = async (input: {
  Bucket: string;
  SrcKey: string;
  DstKey: string;
}) => {
  const { Bucket, SrcKey, DstKey } = input;
  await s3Client.send(
    new CopyObjectCommand({
      CopySource: `/${Bucket}/${SrcKey}`,
      Bucket,
      Key: DstKey,
    })
  );
  await s3Client.send(new DeleteObjectCommand({ Bucket, Key: SrcKey }));
};

const client = new SQSClient({});

const sendSqsMessage = async (params: {
  Bucket: string;
  Key: string;
  Message: any;
}) => {
  const { Bucket, Key, Message } = params;
  const message = JSON.stringify(Message);
  const sendMessage = new SendMessageCommand({
    QueueUrl: CatalogItemsQueue.URL,
    MessageAttributes: {
      Bucket: { DataType: "String", StringValue: Bucket },
      Key: { DataType: "String", StringValue: Key },
    },
    MessageBody: message,
  });
  try {
    const output = await client.send(sendMessage);
    console.log("Message has been sent successfully:", message);
    return {
      success: false as const,
      data: output,
      error: null,
    };
  } catch (error) {
    const errorMessage = `Unable to send the message: ${message}`;
    console.error(errorMessage, error);
    return {
      success: false as const,
      error: error instanceof Error ? error : new Error(errorMessage),
      data: null,
    };
  }
};

const validatorParse = (data: unknown) => {
  return CreateProductCsv.safeParse(data, { errorMap });
};

export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    const Bucket = record.s3.bucket.name;
    const Key = record.s3.object.key;

    const getObjectStream = await getS3ObjectReadStream({ Bucket, Key });
    const csvParserStream = csv().on("data", (csvData) => {
      const { success, data: parsedData, error } = validatorParse(csvData);
      if (success) {
        sendSqsMessage({ Bucket, Key, Message: parsedData });
      } else {
        console.error("Record validation error:", error.flatten());
      }
    });
    await pipeline(getObjectStream, csvParserStream);

    console.log(`Stage 1. The file '${Key}' has been processed`);

    const moveObjectInput = {
      Bucket,
      SrcKey: Key,
      DstKey: Key.replace(
        `${ImportBucket.Path.UPLOADED}/`,
        `${ImportBucket.Path.PARSED}/`
      ),
    };
    await moveObjectInS3Bucket(moveObjectInput);

    console.log(
      `Stage 2. The file has been successfully moved from '${moveObjectInput.SrcKey}' to '${moveObjectInput.DstKey}'`
    );
  }
};
