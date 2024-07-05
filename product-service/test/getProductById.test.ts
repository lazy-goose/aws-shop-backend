import { invokeGatewayProxyEvent } from "./common/invokeEvent";
import { BatchGetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { handler as getProductById } from "../assets/lambda/getProductById";
import { mockClient } from "aws-sdk-client-mock";
import { products, stocks } from "../mock/product.data";

const ddbMock = mockClient(DynamoDBDocumentClient);

const PRODUCT_TABLE_NAME = "PRODUCT_TABLE_NAME";
const STOCK_TABLE_NAME = "STOCK_TABLE_NAME";

describe("Lambda getProductById test group", () => {
  const [product, stock] = [products[0], stocks[0]];

  beforeAll(() => {
    ddbMock
      .on(BatchGetCommand, {
        RequestItems: {
          [PRODUCT_TABLE_NAME]: { Keys: [{ id: product.id }] },
          [STOCK_TABLE_NAME]: { Keys: [{ product_id: product.id }] },
        },
      })
      .resolves({
        $metadata: {},
        Responses: {
          [PRODUCT_TABLE_NAME]: [product],
          [STOCK_TABLE_NAME]: [stock],
        },
      });
  });

  beforeEach(() => {
    process.env = { PRODUCT_TABLE_NAME, STOCK_TABLE_NAME };
  });

  afterEach(() => {
    jest.clearAllMocks();
    ddbMock.resetHistory();
  });

  test("Successfully get product by id", async () => {
    const response = await invokeGatewayProxyEvent(getProductById)({
      pathParameters: { productId: product.id },
    });
    const result = JSON.parse(response.body!);
    expect(response.statusCode).toBe(200);
    expect(result).toMatchObject(product);
  });

  test("Error response [404] on empty product.id", async () => {
    const response = await invokeGatewayProxyEvent(getProductById)({
      pathParameters: { productId: undefined },
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchSnapshot();
  });

  test("Error response [500+] on BatchWriteCommand fail", async () => {
    ddbMock.on(BatchGetCommand).rejectsOnce();
    const response = await invokeGatewayProxyEvent(getProductById)({
      pathParameters: { productId: product.id },
    });
    expect(response.statusCode).toBeGreaterThanOrEqual(500);
    expect(response.body).toMatchSnapshot();
  });
});
