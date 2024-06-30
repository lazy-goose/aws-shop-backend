import { pipeline } from "stream/promises";
import { ImportBucket } from "../../constants";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { S3Handler } from "aws-lambda";
import csv from "csv-parser";
import { NodeJsClient } from "@smithy/types";

const { Path: S3Path } = ImportBucket;

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

export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    const Bucket = record.s3.bucket.name;
    const Key = record.s3.object.key;

    const getObjectStream = await getS3ObjectReadStream({ Bucket, Key });
    const csvParserStream = csv().on("data", (data) => {
      /**
       * CloudWatch records logging
       */
      console.log(`${Bucket} ${Key}:`, data);
    });
    await pipeline(getObjectStream, csvParserStream);

    console.log(`Stage 1. The file '${Key} has been successfully parsed`);

    const moveObjectInput = {
      Bucket,
      SrcKey: Key,
      DstKey: Key.replace(`${S3Path.UPLOADED}/`, `${S3Path.PARSED}/`),
    };
    await moveObjectInS3Bucket(moveObjectInput);

    console.log(
      `Stage 2. The file has been successfully moved from '${moveObjectInput.SrcKey}' to '${moveObjectInput.DstKey}'`
    );
  }
};
