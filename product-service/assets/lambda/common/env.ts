const getValue = <T = string>(name: string, coerce?: (v: unknown) => T) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Wrong lambda environment. No '${name}' variable`);
  }
  return coerce ? coerce(value) : value;
};

export const tableEnv = () => {
  return {
    productsTableName: getValue("PRODUCT_TABLE_NAME"),
    stocksTableName: getValue("STOCK_TABLE_NAME"),
  };
};

export const snsEnv = () => {
  return {
    snsTopicArn: getValue("SNS_TOPIC_ARN"),
  };
};
