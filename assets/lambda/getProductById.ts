import productList from "../../mock/productList.data";
import { APIGatewayProxyEvent } from "aws-lambda";

const BASE_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export type Event = Pick<APIGatewayProxyEvent, "pathParameters">;

export const handler = async (event: Event) => {
  const productId = event.pathParameters?.productId;

  const targetProduct = productList.find((p) => p.id == productId);

  if (!targetProduct) {
    return {
      statusCode: 404,
      headers: {
        ...BASE_HEADERS,
      },
      body: JSON.stringify({
        message: "Product not found",
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      ...BASE_HEADERS,
    },
    body: JSON.stringify(targetProduct),
  };
};
