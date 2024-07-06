import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { createBatchStream } from "../assets/lambda/common/createBatchStream";

const makeTestReadable = (times: number) => {
  const readable = new Readable({ encoding: "utf-8" });
  for (let i = 1; i <= times; i++) {
    readable.push(`${i}`);
  }
  readable.push(null);
  return readable;
};

describe("createBatchStream test group", () => {
  test("Return appropriate chunks", async () => {
    const readable = makeTestReadable(7);
    const fn = jest.fn();
    const batchStream = createBatchStream(3).on("data", fn);
    await pipeline(readable, batchStream);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenNthCalledWith(1, ["1", "2", "3"]);
    expect(fn).toHaveBeenNthCalledWith(2, ["4", "5", "6"]);
    expect(fn).toHaveBeenNthCalledWith(3, ["7"]);
  });
});
