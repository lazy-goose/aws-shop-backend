import productsData from "../../constants/products/data.json";
import cors from "../../constants/products/cors.json";

export const handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": cors.allowOrigin,
      "Access-Control-Allow-Methods": "GET",
    },
    body: JSON.stringify(productsData),
  };
};
