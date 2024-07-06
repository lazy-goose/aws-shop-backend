import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { handler as getProductById } from "../assets/lambda/getProductById";
import { products } from "../mock/product.data";

test("GET 200", async () => {
  for (const item of products) {
    const event = { pathParameters: { productId: item.id } };
    const response = await getProductById(
      event as unknown as APIGatewayProxyEventV2,
      {} as Context,
      () => {}
    );
    const result = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(result).toMatchObject(item);
  }
});

test("GET 404", async () => {
  const event = { pathParameters: { productId: "-1" } };
  const response = await getProductById(
    event as unknown as APIGatewayProxyEventV2,
    {} as Context,
    () => {}
  );
  expect(response.statusCode).toBe(404);
  expect(response).toMatchInlineSnapshot(`
{
  "body": "{"code":404,"message":"Product not found"}",
  "headers": {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  },
  "statusCode": 404,
}
`);
});
