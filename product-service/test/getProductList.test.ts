import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { handler as getProductList } from "../assets/lambda/getProductList";
import { products } from "../mock/product.data";

test("GET 200", async () => {
  const response = await getProductList(
    {} as APIGatewayProxyEventV2,
    {} as Context,
    () => {}
  );
  const result = JSON.parse(response.body);
  expect(response.statusCode).toBe(200);
  expect(result).toMatchObject(products);
});
