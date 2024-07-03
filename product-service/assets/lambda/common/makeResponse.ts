type Headers = Record<string, string>;
type Overridable = {
  defaultHeaders: Headers;
};

export const makeJsonResponse = (overridable: Overridable) => {
  const Ok = (statusCode: number, data: Object, headers: Headers = {}) => {
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

  const Err = (statusCode: number, message: string, headers: Headers = {}) => {
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

  return { Ok, Err };
};
