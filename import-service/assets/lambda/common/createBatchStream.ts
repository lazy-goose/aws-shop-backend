import { Transform } from "stream";

export const createBatchStream = (batchSize = 1) => {
  let batch: any[] = [];
  return new Transform({
    objectMode: true,
    transform(chunk, _, next) {
      batch.push(chunk);
      if (batch.length >= batchSize) {
        this.push(batch);
        batch = [];
      }
      next();
    },
    flush(next) {
      if (batch.length) {
        this.push(batch);
      }
      next();
    },
  });
};
