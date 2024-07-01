import { ImportBucket } from "../../constants";
import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Handler, APIGatewayProxyEventV2 } from "aws-lambda";

const BASE_HEADERS = {
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Origin": "*",
};

const responseOk = (statusCode: number, message: string) => {
  return {
    statusCode,
    headers: { ...BASE_HEADERS, "Content-Type": "text/plain" },
    body: message,
  };
};

const responseErr = (statusCode: number, message: string) => {
  return {
    statusCode,
    headers: { ...BASE_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ statusCode, message }),
  };
};

const catchErrorFallback = (
  e: unknown,
  responseCallback: (statusCode: number, message: string) => Object
) => {
  const defaultMsg = "Unknown processing error";
  const message = e instanceof Error && e.message ? e.message : defaultMsg;
  console.error(message);
  return responseCallback(500, message);
};

/* Main */

const createPresignedUrl = async (putObjectInput: PutObjectCommandInput) => {
  const s3Client = new S3Client();
  const command = new PutObjectCommand(putObjectInput);
  return getSignedUrl(s3Client, command, { expiresIn: 30 });
};

export const handler: Handler<APIGatewayProxyEventV2> = async (event) => {
  try {
    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName) {
      return responseErr(
        500,
        "Invalid Lambda configuration. Environment variable 'BUCKET_NAME' has not been provided"
      );
    }

    const fileName = event.queryStringParameters?.["name"]?.trimEnd();
    if (!fileName || !fileName.endsWith(".csv")) {
      return responseErr(
        400,
        "Bad request. Query string must contain parameter '?name={filename}.csv'"
      );
    }

    const presignedUrl = await createPresignedUrl({
      Bucket: bucketName,
      Key: `${ImportBucket.Path.UPLOADED}/${fileName}`,
    });

    return responseOk(200, presignedUrl);
  } catch (e) {
    return catchErrorFallback(e, responseErr);
  }
};
