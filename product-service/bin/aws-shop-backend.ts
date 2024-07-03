#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ProductServiceStack } from "../lib/product-service-stack";
import { ImportProductsStack } from "../lib/import-products-stack";

const app = new cdk.App();

const productServiceStack = new ProductServiceStack(app, "ProductServiceStack");
const importProductsStack = new ImportProductsStack(app, "ImportProductStack", {
  productTable: productServiceStack.productTable,
  stockTable: productServiceStack.stockTable,
});
