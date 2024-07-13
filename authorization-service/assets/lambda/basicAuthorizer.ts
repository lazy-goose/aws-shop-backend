import { APIGatewayRequestSimpleAuthorizerHandlerV2 } from "aws-lambda";

/**
 * @environment ```
 * process.env.CREDENTIALS = 'name1=pass1:name2=pass2...'
 * ```
 */
const isAuthorized = (username: string, password: string) => {
  return (process.env.CREDENTIALS || "")
    .split(":")
    .map((credential) => credential.split("=").map((v) => v.trim()))
    .filter(([name, pass]) => name && pass)
    .some(([name, pass]) => name === username && pass === password);
};

/**
 * @param {string} headerValue - Authorization header value. The value must match the Basic auth scheme
 * @example parseAuthHeader("Basic bGF6eS1nb29zZT1URVNUX1BBU1NXT1JE")
 */
const parseAuthHeader = (headerValue: string) => {
  const [authSchema, encodedToken] = headerValue.split(" ");
  if (authSchema !== "Basic") {
    throw new Error("Unsupported authorization schema");
  }
  const decodedToken = Buffer.from(encodedToken, "base64").toString("utf-8");
  const [username, password] = decodedToken.split(":").map((v) => v.trim());
  if (!username || !password) {
    throw new Error("Invalid token");
  }
  return { username, password };
};

const safeParseAuthHeader = (headerValue: string) => {
  try {
    return {
      success: true as const,
      credentials: parseAuthHeader(headerValue),
      error: null,
    };
  } catch (e) {
    return {
      success: false as const,
      credentials: null,
      error: e as Error,
    };
  }
};

export const handler: APIGatewayRequestSimpleAuthorizerHandlerV2 = async (
  event
) => {
  const authHeader = event.headers?.["authorization"];
  console.log(`Authorization header: ${authHeader}`);
  if (!authHeader) {
    console.log("Denied: Authorization header was not provided");
    return {
      isAuthorized: false,
    };
  }
  const { success, error, credentials } = safeParseAuthHeader(authHeader);
  if (!success) {
    console.log("Denied: Invalid credentials.", error);
    return {
      isAuthorized: false,
    };
  }
  const isAuth = isAuthorized(credentials.username, credentials.password);
  console.log(isAuth ? "Allowed:" : "Denied:", credentials);
  return {
    isAuthorized: isAuth,
  };
};
