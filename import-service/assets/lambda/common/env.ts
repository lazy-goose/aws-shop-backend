const getValue = <T = string>(name: string, coerce?: (v: unknown) => T) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Wrong lambda environment. No '${name}' variable`);
  }
  return coerce ? coerce(value) : value;
};

export const sqsEnv = () => {
  return {
    sqsUrl: getValue("SQS_URL"),
  };
};
