import {
  APIGatewayRequestAuthorizerEventV2,
  APIGatewaySimpleAuthorizerResult,
  Context,
} from "aws-lambda";
import { handler as basicAuthorizer } from "../assets/lambda/basicAuthorizer";

const invokeBasicAuthorizer = async (
  event: Partial<APIGatewayRequestAuthorizerEventV2> = {}
) => {
  return basicAuthorizer(
    event as APIGatewayRequestAuthorizerEventV2,
    {} as Context,
    () => {}
  ) as Promise<APIGatewaySimpleAuthorizerResult>;
};

const authHeader = (token: string) => ({
  authorization: `Basic ${token}`,
});

const toBase64 = (string: string) => {
  return Buffer.from(string).toString("base64");
};

const USERS = [
  ["lazy-goose", "TEST_PASSWORD"],
  ["greedy-goose", "GU$$Y_LIKER"],
];

describe("Lambda basicAuthorizer test group", () => {
  beforeEach(() => {
    process.env = {
      CREDENTIALS: USERS.map((u) => u.join("=")).join(":"),
    };
  });

  describe("Authorize users with valid credentials", () => {
    test.each(USERS)("Credentials: %s=%s", async (name, pass) => {
      const validToken = toBase64(`${name}:${pass}`);
      const response = await invokeBasicAuthorizer({
        headers: {
          ...authHeader(validToken),
        },
      });
      expect(response.isAuthorized).toBeTruthy();
    });
  });

  test("Forbid request without auth header", async () => {
    const response = await invokeBasicAuthorizer({ headers: {} });
    expect(response.isAuthorized).toBeFalsy();
  });

  test("Forbid request with non Basic auth schema", async () => {
    const invalidAuthSchema = "Digest";
    const [name, pass] = USERS[0].join(":");
    const validToken = toBase64(`${name}:${pass}`);
    try {
      const response = await invokeBasicAuthorizer({
        headers: {
          Authorization: `${invalidAuthSchema} ${validToken}`,
        },
      });
      expect(response.isAuthorized).toBeFalsy();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  describe("Forbid request with empty credentials", () => {
    const [name, pass] = USERS[0];

    test("No username", async () => {
      const invalidToken = toBase64(`${name}:`);
      try {
        const response = await invokeBasicAuthorizer({
          headers: { ...authHeader(invalidToken) },
        });
        expect(response.isAuthorized).toBeFalsy();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test("No password", async () => {
      const invalidToken = toBase64(`:${pass}`);
      try {
        const response = await invokeBasicAuthorizer({
          headers: { ...authHeader(invalidToken) },
        });
        expect(response.isAuthorized).toBeFalsy();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
