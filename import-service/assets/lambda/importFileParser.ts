import { pipeline } from "stream/promises";
import { ImportBucket } from "../../constants";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  SQSClient,
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
} from "@aws-sdk/client-sqs";
import { S3Handler } from "aws-lambda";
import { NodeJsClient } from "@smithy/types";
import { CreateProductFromCsvDto } from "./common/schemas";
import { errorMap } from "zod-validation-error";
import { sqsEnv } from "./common/env";
import { createBatchStream } from "./common/createBatchStream";
import crypto from "crypto";
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

const sqsClient = new SQSClient({});

const validatorParse = (data: unknown) => {
  return CreateProductFromCsvDto.safeParse(data, { errorMap });
};

export const handler: S3Handler = async (event) => {
  const { sqsUrl } = sqsEnv();

  for (const record of event.Records) {
    const Bucket = record.s3.bucket.name;
    const Key = record.s3.object.key;

    const getObjectStream = await getS3ObjectReadStream({ Bucket, Key });
    const csvParserStream = csv();
    const batchStream = createBatchStream(5).on("data", (rawRecords: any[]) => {
      const records: any[] = [];
      for (const record of rawRecords) {
        const { success, data, error } = validatorParse(record);
        if (success) {
          records.push(data);
        } else {
          console.error("Skip record:", error.flatten());
        }
      }
      if (!records.length) {
        return;
      }
      const Entries: SendMessageBatchRequestEntry[] = records.map((data) => {
        const product_id = crypto.randomUUID();
        return {
          Id: product_id,
          MessageAttributes: {
            Bucket: { DataType: "String", StringValue: Bucket },
            Key: { DataType: "String", StringValue: Key },
          },
          MessageBody: JSON.stringify({ product_id, ...data }),
        };
      });
      const sendMessageBatchCommand = new SendMessageBatchCommand({
        QueueUrl: sqsUrl,
        Entries,
      });
      /* async */ sqsClient
        .send(sendMessageBatchCommand)
        .then(() => {
          console.log("Message group has been sent successfully:", Entries);
        })
        .catch((error) => {
          console.error("Message group has not been sent:", error, Entries);
        });
    });
    await pipeline(getObjectStream, csvParserStream, batchStream);

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
