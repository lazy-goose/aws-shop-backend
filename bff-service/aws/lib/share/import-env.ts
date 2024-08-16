import path from 'path';

require('dotenv').config({
  path: path.resolve(process.cwd(), '..', '.env'),
});

require('dotenv').config({
  path: path.resolve(process.cwd(), '.env'),
});

export const env = <T extends string>(...names: T[]) => {
  return Object.fromEntries(
    names.map((n) => {
      const [key, value] = [n, process.env[n]];
      if (!value) {
        throw new Error(
          `Wrong cdk environment. Variable 'process.env[${key}]' is undefined`,
        );
      }
      return [key, value];
    }),
  ) as Record<T, string>;
};
