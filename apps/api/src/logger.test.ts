import { Writable } from "node:stream";

import { describe, expect, it } from "vitest";

import { runWithRequestContext } from "./lib/observability/context";
import { createLogger } from "./logger";

function capture() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _enc, cb) {
      lines.push(chunk.toString().trim());
      cb();
    },
  });
  return { lines, stream };
}

describe("createLogger", () => {
  it("is silent in test at the default level", () => {
    const { lines, stream } = capture();
    createLogger({ NODE_ENV: "test", LOG_LEVEL: "info" }, stream).error("hello");
    expect(lines).toEqual([]);
  });

  it("masks message text, fields and errors", () => {
    const { lines, stream } = capture();
    const logger = createLogger({ NODE_ENV: "production", LOG_LEVEL: "info" }, stream);
    logger.info({ email: "a@b.co", note: "ring +44 7700 900123" }, "hi sara@example.com");
    logger.error({ err: new Error("bad a@b.co") }, "failed");
    const text = lines.join("\n");
    expect(text).not.toMatch(/a@b\.co|sara@example|900123/);
    expect(text).toContain("hi [email]");
  });

  it("adds the request id from async context to any logger, once", () => {
    const { lines, stream } = capture();
    const logger = createLogger({ NODE_ENV: "production", LOG_LEVEL: "info" }, stream);
    runWithRequestContext({ requestId: "abc" }, () => {
      logger.info("plain");
      logger.child({ requestId: "abc" }).info("child");
    });
    logger.info("outside");
    const [plain, child, outside] = lines.map((l) => JSON.parse(l) as Record<string, unknown>);
    expect(plain?.requestId).toBe("abc");
    expect(child?.requestId).toBe("abc");
    expect(lines[1]?.match(/requestId/g)).toHaveLength(1);
    expect(outside).not.toHaveProperty("requestId");
  });
});
