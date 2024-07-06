import { handler as importProductsFile } from "../assets/lambda/importProductsFile";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");

const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;

const BUCKET_NAME = "mock-s3-bucket-name";
const PRESIGNED_URL = "http://mock-presigned-url";

const invokeImportProductsFile = <E extends APIGatewayProxyEventV2>(
  event: Partial<E> = {}
) => {
  return importProductsFile(
    event as E,
    {} as Context,
    () => {}
  ) as Promise<APIGatewayProxyStructuredResultV2>;
};

describe("Lambda importProductsFile test group", () => {
  beforeEach(() => {
    process.env = { BUCKET_NAME };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Wrong filename query string parameter", () => {
    test("Empty filename", async () => {
      const response = await invokeImportProductsFile({
        queryStringParameters: { name: "" },
      });
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    test("Not a .csv file extension", async () => {
      const response = await invokeImportProductsFile({
        queryStringParameters: { name: "file.txt" },
      });
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  test("Returns response with presigned url", async () => {
    mockGetSignedUrl.mockReturnValueOnce(Promise.resolve(PRESIGNED_URL));
    const response = await invokeImportProductsFile({
      queryStringParameters: { name: "file.csv" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(PRESIGNED_URL);
    expect(mockGetSignedUrl).toHaveBeenCalled();
  });

  test("Returns error response on getSignedUrl reject", async () => {
    mockGetSignedUrl.mockRejectedValueOnce(new Error());
    const response = await invokeImportProductsFile({
      queryStringParameters: { name: "file.csv" },
    });
    expect(response.statusCode).toBeGreaterThanOrEqual(500);
    expect(mockGetSignedUrl).toHaveBeenCalled();
  });
});
