import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cssPath = resolve(process.cwd(), "app/globals.css");
const css = readFileSync(cssPath, "utf8");

describe("design language", () => {
  it("keeps the canonical brand and font tokens", () => {
    expect(css).toMatch(/--accent:\s*#17d059/i);
    expect(css).toMatch(/--font-main:\s*Arial,\s*Helvetica,\s*sans-serif/i);
  });

  it("drives the base font family from the token", () => {
    expect(css).toMatch(/font-family:\s*var\(--font-main\)/);
  });

  it("does not reintroduce serif display fonts", () => {
    expect(css).not.toMatch(/Georgia/i);
    expect(css).not.toMatch(/Times New Roman/i);
  });

  it("defines the brand accent in exactly one place", () => {
    const occurrences = css.match(/#17d059/gi) ?? [];
    expect(occurrences).toHaveLength(1);
  });
});
