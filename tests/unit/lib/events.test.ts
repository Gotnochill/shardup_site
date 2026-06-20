import { describe, expect, it } from "vitest";
import { formatEventDetailDate, formatEventListDate } from "../../../lib/events";

// Newer ICU versions use narrow/no-break spaces around AM/PM; normalize for stable assertions.
function normalize(value: string) {
  return value.replace(/[\u202f\u00a0]/g, " ");
}

const starts = new Date("2026-06-22T17:30:00.000Z");
const ends = new Date("2026-06-22T18:30:00.000Z");

describe("formatEventListDate", () => {
  it("formats a start/end range in UTC", () => {
    expect(normalize(formatEventListDate(starts, ends))).toBe(
      "Jun 22, 2026, 5:30 PM - 6:30 PM UTC",
    );
  });

  it("formats a single start time without a UTC suffix", () => {
    expect(normalize(formatEventListDate(starts, null))).toBe("Jun 22, 2026, 5:30 PM");
  });
});

describe("formatEventDetailDate", () => {
  it("formats a full start/end range in UTC", () => {
    expect(normalize(formatEventDetailDate(starts, ends))).toBe(
      "Monday, June 22, 2026 at 5:30 PM - 6:30 PM UTC",
    );
  });

  it("appends a UTC suffix for a single start time", () => {
    expect(normalize(formatEventDetailDate(starts, null))).toBe(
      "Monday, June 22, 2026 at 5:30 PM UTC",
    );
  });
});
