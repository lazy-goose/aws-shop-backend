import { APIGatewayProxyEventV2 } from "aws-lambda";

export const apiGatewayProxyEvent = {
  version: "2.0",
  routeKey: "ANY /nodejs-apig-function-1G3XMPLZXVXYI",
  rawPath: "/default/nodejs-apig-function-1G3XMPLZXVXYI",
  rawQueryString: "",
  cookies: [
    "s_fid=7AABXMPL1AFD9BBF-0643XMPL09956DE2",
    "regStatus=pre-register",
  ],
  headers: {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-encoding": "gzip, deflate, br",
  },
  requestContext: {
    accountId: "123456789012",
    apiId: "r3pmxmplak",
    domainName: "r3pmxmplak.execute-api.us-east-2.amazonaws.com",
    domainPrefix: "r3pmxmplak",
    http: {
      method: "GET",
      path: "/default/nodejs-apig-function-1G3XMPLZXVXYI",
      protocol: "HTTP/1.1",
      sourceIp: "205.255.255.176",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
    },
    requestId: "JKJaXmPLvHcESHA=",
    routeKey: "ANY /nodejs-apig-function-1G3XMPLZXVXYI",
    stage: "default",
    time: "10/Mar/2020:05:16:23 +0000",
    timeEpoch: 1583817383220,
  },
  body: "null",
  isBase64Encoded: true,
} satisfies APIGatewayProxyEventV2;
