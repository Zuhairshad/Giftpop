import { describe, expect, it } from "vitest";

import { parseHandoffEntry, readHandoffEntry, writeHandoff } from "./handoff";

const NUMBER = "GP-PK-7K2M9Q";

const parseHandoff = (raw: string | null | undefined, number: string) =>
  parseHandoffEntry(raw, number)?.contact ?? null;
const readHandoff = (number: string, storage: Parameters<typeof readHandoffEntry>[1]) =>
  readHandoffEntry(number, storage)?.contact ?? null;

describe("parseHandoff", () => {
  it("returns the contact for a valid entry", () => {
    expect(parseHandoff(JSON.stringify({ number: NUMBER, contact: " a@b.co " }), NUMBER)).toBe(
      "a@b.co",
    );
  });
  it("returns null when missing", () => {
    expect(parseHandoff(null, NUMBER)).toBeNull();
    expect(parseHandoff("", NUMBER)).toBeNull();
  });
  it("returns null when corrupt", () => {
    expect(parseHandoff("{oops", NUMBER)).toBeNull();
    expect(parseHandoff('{"number":1}', NUMBER)).toBeNull();
    expect(parseHandoff("null", NUMBER)).toBeNull();
  });
  it("returns null for another order", () => {
    expect(
      parseHandoff(JSON.stringify({ number: "GP-PK-AAAAAA", contact: "a@b.co" }), NUMBER),
    ).toBeNull();
  });
});

describe("readHandoff and writeHandoff", () => {
  it("round-trips through a storage", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    };
    writeHandoff(NUMBER, "0300 1234567", storage);
    expect(readHandoff(NUMBER, storage)).toBe("0300 1234567");
  });
  it("never throws when storage does", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readHandoff(NUMBER, broken)).toBeNull();
    expect(() => writeHandoff(NUMBER, "x@y.zz", broken)).not.toThrow();
    expect(readHandoff(NUMBER, undefined)).toBeNull();
  });
});

describe("first name in the handoff", () => {
  const memory = (): Pick<Storage, "getItem" | "setItem"> => {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    };
  };

  it("round-trips the first name with the contact", () => {
    const storage = memory();
    writeHandoff(NUMBER, "a@b.co", storage, "Sara");
    expect(readHandoffEntry(NUMBER, storage)).toEqual({ contact: "a@b.co", firstName: "Sara" });
  });
  it("answers a null name for entries written without one", () => {
    const storage = memory();
    writeHandoff(NUMBER, "a@b.co", storage);
    expect(readHandoffEntry(NUMBER, storage)).toEqual({ contact: "a@b.co", firstName: null });
  });
  it("drops a bad name but keeps the contact", () => {
    const raw = JSON.stringify({ number: NUMBER, contact: "a@b.co", firstName: 7 });
    expect(parseHandoffEntry(raw, NUMBER)).toEqual({ contact: "a@b.co", firstName: null });
    const long = JSON.stringify({ number: NUMBER, contact: "a@b.co", firstName: "x".repeat(41) });
    expect(parseHandoffEntry(long, NUMBER)?.firstName).toBeNull();
  });
});
