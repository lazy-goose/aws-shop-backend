require("fs/promises")
  .copyFile(...process.argv.slice(2, 4), 1)
  .catch(() => {});
