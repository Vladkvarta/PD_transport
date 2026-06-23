import { describe, expect, it } from "vitest";
import { parseMileage } from "./mileage.js";

describe("parseMileage", () => {
  it.each([
    ["125430", 125430],
    ["125 430", 125430],
    ["125.430", 125430],
    ["0", 0],
  ])("parses %s", (input, expected) => {
    expect(parseMileage(input)).toBe(expected);
  });

  it.each(["", "-1", "12 км", "12345678"])("rejects %s", (input) => {
    expect(parseMileage(input)).toBeNull();
  });
});

