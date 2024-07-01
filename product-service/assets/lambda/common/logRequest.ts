import { APIGatewayProxyEventV2 } from "aws-lambda";

export const logRequest = (e: APIGatewayProxyEventV2) => {
  let body: Record<string, unknown> | null;
  try {
    // @ts-expect-error
    body = JSON.parse(e.body);
  } catch {
    body = null;
  }
  console.log({
    request: `${e.requestContext.http.method} ${e.rawPath}`,
    headers: e.headers,
    body,
  });
};
