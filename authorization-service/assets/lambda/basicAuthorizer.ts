import { APIGatewayRequestSimpleAuthorizerHandlerV2 } from "aws-lambda";

/**
 * @environment ```
 * process.env.CREDENTIALS = 'name1=pass1:name2=pass2...'
 * ```
 */
const isAuthorized = (username: string, password: string) => {
  return (process.env.CREDENTIALS || "")
    .split(":")
    .map((credential) => credential.split("=").map((c) => c.trim()))
    .some(
      ([name, pass]) => name && pass && name === username && pass === password
    );
};

/**
 * @example parseAuthHeader("Basic bGF6eS1nb29zZT1URVNUX1BBU1NXT1JE")
 */
const parseAuthHeader = (headerValue: string) => {
  const [authSchema, encodedToken] = headerValue.split(" ");
  if (authSchema !== "Basic") {
    throw new Error("Unsupported authorization schema");
  }
  const decodedToken = Buffer.from(encodedToken, "base64").toString("utf-8");
  const [username, password] = decodedToken.split(":");
  if (!username || !password) {
    throw new Error("Incorrect token");
  }
  return { username, password };
};

const safeParseAuthHeader = (headerValue: string) => {
  try {
    return {
      error: null,
      ...parseAuthHeader(headerValue),
    };
  } catch (e) {
    return {
      error: e as Error,
      username: null,
      password: null,
    };
  }
};

const log = (...pass: any) => console.log("[ALLOWED]", ...pass);
const err = (...pass: any) => console.error("[DENIED]", ...pass);

export const handler: APIGatewayRequestSimpleAuthorizerHandlerV2 = async (
  event
) => {
  const authHeader = event.headers?.["authorization"];
  console.log("Authorization:", authHeader);
  if (!authHeader) {
    err("Authorization header was not provided");
    return {
      isAuthorized: false,
    };
  }

  const { error, username, password } = safeParseAuthHeader(authHeader);
  if (error) {
    err(error);
    return {
      isAuthorized: false,
    };
  }

  const isAuthz = isAuthorized(username, password);
  if (isAuthz) {
    log(`username: ${username},`, `password: ${password}`);
  } else {
    err(`username: ${username},`, `password: ${password}`);
  }
  return {
    isAuthorized: isAuthz,
  };
};
