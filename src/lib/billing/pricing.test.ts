import { describe, expect, it } from "vitest";

import {
  answerCostMcr,
  answerReserveMcr,
  estimatePrompt,
  tokensOf,
} from "./pricing";

describe("pricing placeholders", () => {
  it("lands the prototype's short answers near Figma's costs", () => {
    // ~100 output tokens for a one-line prompt (Figma: 0.9, 1.4, 0.3 credits).
    expect(Math.round(answerCostMcr("gpt", 20, 96) / 100) / 10).toBe(0.9);
    expect(Math.round(answerCostMcr("claude", 20, 142) / 100) / 10).toBe(1.4);
    expect(Math.round(answerCostMcr("gemini", 20, 58) / 100) / 10).toBe(0.3);
  });

  it("reserves at least the most an answer can cost", () => {
    expect(answerReserveMcr("gpt", 50)).toBeGreaterThanOrEqual(
      answerCostMcr("gpt", 50, 1200),
    );
  });

  it("estimates a range and the catch-up part", () => {
    const e = estimatePrompt(
      [
        { model: "gpt", inputTokens: 40, catchUpTokens: 0 },
        { model: "gemini", inputTokens: 60, catchUpTokens: 20 },
      ],
      { best: false },
    );
    expect(e.minMcr).toBeLessThan(e.maxMcr);
    expect(e.catchUp).toEqual([{ model: "gemini", mcr: 10 }]);
  });

  it("counts Bangla as denser text", () => {
    expect(tokensOf("abcd")).toBe(1);
    expect(tokensOf("কফির ঘর")).toBeGreaterThan(tokensOf("abcdefg"));
  });
});
