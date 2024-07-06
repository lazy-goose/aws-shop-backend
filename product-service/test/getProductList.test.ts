import { invokeGatewayProxyEvent } from "./common/invokeEvent";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { handler as getProductList } from "../assets/lambda/getProductList";
import { mockClient } from "aws-sdk-client-mock";
import { products, stocks } from "../mock/products.data";

const ddbMock = mockClient(DynamoDBDocumentClient);

const PRODUCT_TABLE_NAME = "PRODUCT_TABLE_NAME";
const STOCK_TABLE_NAME = "STOCK_TABLE_NAME";

describe("Lambda getProductList test group", () => {
  beforeAll(() => {
    ddbMock
      .on(ScanCommand, { TableName: PRODUCT_TABLE_NAME })
      .resolves({ Items: products });
    ddbMock
      .on(ScanCommand, { TableName: STOCK_TABLE_NAME })
      .resolves({ Items: stocks });
  });

  beforeEach(() => {
    process.env = { PRODUCT_TABLE_NAME, STOCK_TABLE_NAME };
  });

  afterEach(() => {
    jest.clearAllMocks();
    ddbMock.resetHistory();
  });

  test("Successfully get product list", async () => {
    const response = await invokeGatewayProxyEvent(getProductList)();
    const result = JSON.parse(response.body!);
    expect(response.statusCode).toBe(200);
    expect(result).toMatchObject(products);
  });

  test("Error response [500+] on ScanCommand fail", async () => {
    ddbMock.on(ScanCommand).rejectsOnce(new Error("Tets error"));
    const response = await invokeGatewayProxyEvent(getProductList)();
    expect(response.statusCode).toBeGreaterThanOrEqual(500);
    expect(response.body).toMatchSnapshot();
  });
});
