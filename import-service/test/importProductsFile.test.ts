import { handler as importProductsFile } from "../assets/lambda/importProductsFile";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEventV2, Context } from "aws-lambda";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");

const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;

const PRESIGNED_URL = "http://mock-presigned-url";

describe("Lambda importProductsFile test group", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, BUCKET_NAME: "mock-s3-bucket-name" };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Wrong filename query string parameter", () => {
    test("Empty filename", async () => {
      const event = { queryStringParameters: { name: "" } };
      const response = await importProductsFile(
        event as unknown as APIGatewayProxyEventV2,
        {} as Context,
        () => {}
      );
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    test("Not a .csv file extension", async () => {
      const event = { queryStringParameters: { name: "file.txt" } };
      const response = await importProductsFile(
        event as unknown as APIGatewayProxyEventV2,
        {} as Context,
        () => {}
      );
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  test("Returns response with presigned url", async () => {
    mockGetSignedUrl.mockReturnValueOnce(Promise.resolve(PRESIGNED_URL));
    const event = { queryStringParameters: { name: "file.csv" } };
    const response = await importProductsFile(
      event as unknown as APIGatewayProxyEventV2,
      {} as Context,
      () => {}
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(PRESIGNED_URL);
    expect(mockGetSignedUrl).toHaveBeenCalled();
  });

  test("Returns error response on getSignedUrl reject", async () => {
    mockGetSignedUrl.mockRejectedValueOnce(new Error());
    const event = { queryStringParameters: { name: "file.csv" } };
    const response = await importProductsFile(
      event as unknown as APIGatewayProxyEventV2,
      {} as Context,
      () => {}
    );
    expect(response.statusCode).toBeGreaterThanOrEqual(500);
    expect(mockGetSignedUrl).toHaveBeenCalled();
  });
});
