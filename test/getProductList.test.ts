import { handler as getProductList } from "../assets/lambda/getProductList";
import { products } from "../mock/product.data";

test("GET 200", async () => {
  const response = await getProductList();
  const result = JSON.parse(response.body);
  expect(response.statusCode).toBe(200);
  expect(result).toMatchObject(products);
});
