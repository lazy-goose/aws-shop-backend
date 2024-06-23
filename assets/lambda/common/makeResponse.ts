type Overridable = {
  defaultHeaders: Record<string, string>;
};

export const makeResponseOk =
  (overridable: Overridable) =>
  (statusCode: number, data: Object, headers: Record<string, string> = {}) => {
    return {
      statusCode,
      headers: {
        ...overridable.defaultHeaders,
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    };
  };

export const makeResponseErr =
  (overridable: Overridable) =>
  (
    statusCode: number,
    message: string,
    headers: Record<string, string> = {}
  ) => {
    return {
      statusCode,
      headers: {
        ...overridable.defaultHeaders,
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ statusCode, message }),
    };
  };
