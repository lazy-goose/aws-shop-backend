export const tablesConf = () => {
  const productsTableName = process.env.PRODUCT_TABLE_NAME;
  const stocksTableName = process.env.STOCK_TABLE_NAME;

  if (!productsTableName || !stocksTableName) {
    throw new Error(
      "Lambda function was deployed with the wrong environment configuration"
    );
  }

  return {
    productsTableName,
    stocksTableName,
  };
};
