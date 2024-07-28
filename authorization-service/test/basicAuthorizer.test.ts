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

const toBase64 = (string: string) => {
  return Buffer.from(string).toString("base64");
};

const Auth = (encode: string, schema = "Basic") => ({
  headers: {
    authorization: `${schema} ${toBase64(encode)}`,
  },
});

describe("Lambda basicAuthorizer test group", () => {
  beforeEach(() => {
    process.env = {
      CREDENTIALS: "lazy-goose=TEST_PASSWORD:greedy-goose=GU$$Y_LIKER",
    };
  });

  /* Allow */

  describe("Authorize users with valid credentials", () => {
    test.each(["lazy-goose:TEST_PASSWORD", "greedy-goose:GU$$Y_LIKER"])(
      "Credentials: '%s'",
      async (credentials) => {
        const response = await invokeBasicAuthorizer(Auth(credentials));
        expect(response.isAuthorized).toBeTruthy();
      }
    );
  });

  /* Forbid */

  test("Forbid request without Authorization header", async () => {
    const response = await invokeBasicAuthorizer({ headers: {} });
    expect(response.isAuthorized).toBeFalsy();
  });

  test("Forbid request with non-Basic authorization schema", async () => {
    const response = await invokeBasicAuthorizer(
      Auth("lazy-goose:TEST_PASSWORD", "Digest")
    );
    expect(response.isAuthorized).toBeFalsy();
  });

  describe("Forbid request with empty credentials", () => {
    test.each([
      ["No username", ":TEST_PASSWORD"],
      ["No username", " :TEST_PASSWORD"],
      ["No username", "undefined:TEST_PASSWORD"],
      ["No password", "lazy-goose:"],
      ["No password", "lazy-goose: "],
      ["No password", "lazy-goose:undefined"],
      ["No username/password", ":"],
      ["No username/password", " : "],
      ["No username/password", "undefined:undefined"],
    ])("%s: '%s'", async (_, credentials) => {
      const response = await invokeBasicAuthorizer(Auth(credentials));
      expect(response.isAuthorized).toBeFalsy();
    });
  });
});
