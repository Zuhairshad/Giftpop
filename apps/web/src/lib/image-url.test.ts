import { describe, expect, it } from "vitest";

import { canOptimise, optimisedImageUrl, parseBases } from "./image-url";

const BASES = parseBases("http://localhost:4000/v1/assets/files/, https://assets.example.com");

describe("image URLs", () => {
  it("normalises the configured bases and ignores junk", () => {
    expect(BASES).toEqual([
      "http://localhost:4000/v1/assets/files/",
      "https://assets.example.com/",
    ]);
    expect(parseBases("not a url,")).toEqual([]);
  });

  it("resizes only assets under a configured host, at a width Next serves", () => {
    expect(optimisedImageUrl("https://assets.example.com/a b.webp", 256, BASES)).toBe(
      "/_next/image?url=https%3A%2F%2Fassets.example.com%2Fa%20b.webp&w=256&q=75",
    );
    expect(optimisedImageUrl("https://assets.example.com/x.webp", 700, BASES)).toContain("&w=750&");
  });

  it("leaves any other URL alone so it still loads", () => {
    expect(optimisedImageUrl("https://old-host.example.com/x.webp", 256, BASES)).toBe(
      "https://old-host.example.com/x.webp",
    );
    expect(canOptimise("http://localhost:4000/v1/assets/filesX/y.webp", BASES)).toBe(false);
    expect(canOptimise("https://assets.example.com/y.webp", [])).toBe(false);
  });
});
