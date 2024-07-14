import { APIGatewayProxyResultV2 } from "aws-lambda";

type Headers = Record<string, string>;
type Overridable = {
  defaultHeaders: Headers;
};

export const makeJsonResponse = (overridable: Overridable) => {
  const Ok = (statusCode: number, data: any, headers: Headers = {}) => {
    return {
      statusCode,
      headers: {
        ...overridable.defaultHeaders,
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    } satisfies APIGatewayProxyResultV2;
  };

  const Err = (statusCode: number, error: any, headers: Headers = {}) => {
    return {
      statusCode,
      headers: {
        ...overridable.defaultHeaders,
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ statusCode, error }),
    } satisfies APIGatewayProxyResultV2;
  };

  return { Ok, Err };
};

export const fallbackCatchError = (
  makeResponse: (statusCode: number, msg: string) => APIGatewayProxyResultV2,
  error: unknown,
  defaultMsg = "Unknown processing error"
) => {
  const msg = error instanceof Error ? error.message : defaultMsg;
  console.error(msg);
  return makeResponse(500, msg);
};
