import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Template } from "aws-cdk-lib/assertions";
import { ProductServiceStack } from "../lib/product-service-stack";

test("Lambda functions created", () => {
  const app = new cdk.App();
  const stack = new ProductServiceStack(app, "MyTestStack");
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::ApiGateway::Resource", {
    PathPart: "products",
  });
  template.hasResourceProperties("AWS::ApiGateway::Resource", {
    PathPart: "{productId}",
  });

  template.resourcePropertiesCountIs(
    "AWS::Lambda::Function",
    {
      Runtime: lambda.Runtime.NODEJS_LATEST.name,
    },
    2
  );
});
