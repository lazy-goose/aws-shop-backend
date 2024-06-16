import { handler as getProductById } from "../assets/lambda/getProductById";
import productsData from "../constants/products/data.json";

test("GET 200", async () => {
  for (const item of productsData) {
    const event = { pathParameters: { productId: item.id } };
    const response = await getProductById(event);
    const result = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(result).toMatchObject(item);
  }
});

test("GET 404", async () => {
  const event = { pathParameters: { productId: "-1" } };
  const response = await getProductById(event);
  expect(response.statusCode).toBe(404);
  expect(response).toMatchInlineSnapshot(`
{
  "body": "{"message":"Product not found"}",
  "headers": {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  },
  "statusCode": 404,
}
`);
});
