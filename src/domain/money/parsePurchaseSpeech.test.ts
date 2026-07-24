import { parsePurchaseSpeech, buildWallSpokenSummary, moneyForSpeech, CATEGORY_INTENT } from "./parsePurchaseSpeech";
import { WallVerdict } from "./applyPurchase";

describe("parsePurchaseSpeech", () => {
  it("extracts a digit amount with a dollar sign", () => {
    const result = parsePurchaseSpeech("I want to buy dinner for $45");
    expect(result.amountCents).toBe(4500);
    expect(result.merchant).toBe("Dinner");
    expect(result.category).toBe("Dining");
  });

  it("extracts a digit amount followed by the word dollars", () => {
    const result = parsePurchaseSpeech("buy new shoes for 140 dollars");
    expect(result.amountCents).toBe(14000);
    expect(result.merchant).toBe("New Shoes");
    expect(result.category).toBe("Shopping");
  });

  it("falls back to spelled-out numbers", () => {
    const result = parsePurchaseSpeech("I'd like to buy coffee for forty five dollars");
    expect(result.amountCents).toBe(4500);
    // Coffee is its own category, distinct from Dining — see CATEGORY_INTENT.
    expect(result.category).toBe("Coffee");
  });

  it("handles compound spelled-out numbers with hundred", () => {
    const result = parsePurchaseSpeech("purchase a tv for one hundred and twenty dollars");
    expect(result.amountCents).toBe(12000);
  });

  it("defaults category to Other when nothing matches", () => {
    const result = parsePurchaseSpeech("buy a gift for 20 dollars");
    expect(result.category).toBe("Other");
  });

  it("returns null amount when no number is spoken", () => {
    const result = parsePurchaseSpeech("groceries");
    expect(result.amountCents).toBeNull();
    expect(result.category).toBe("Groceries");
  });

  it("handles amounts with cents", () => {
    const result = parsePurchaseSpeech("gas for $42.50");
    expect(result.amountCents).toBe(4250);
    expect(result.category).toBe("Transport");
  });

  it("detects the new intent-mapped categories", () => {
    expect(parsePurchaseSpeech("buy a book for $15").category).toBe("Books");
    expect(parsePurchaseSpeech("gym membership for $40").category).toBe("Gym");
    expect(parsePurchaseSpeech("rent for $1200").category).toBe("Rent");
    expect(parsePurchaseSpeech("electricity bill for $80").category).toBe("Utilities");
    expect(parsePurchaseSpeech("insurance for $60").category).toBe("Insurance");
  });

  it("does not let 'gas' (Transport) swallow a utilities keyword, since Transport is checked first", () => {
    // Documents the real, accepted limitation noted in CATEGORY_KEYWORDS:
    // a natural-gas utility bill still resolves to Transport, not Utilities,
    // because "gas" alone is already claimed earlier in category order.
    expect(parsePurchaseSpeech("pay the gas bill for $60").category).toBe("Transport");
  });
});

describe("CATEGORY_INTENT", () => {
  it("maps every category to a real intent, with no accidental gaps", () => {
    for (const category of Object.keys(CATEGORY_INTENT)) {
      expect(CATEGORY_INTENT[category as keyof typeof CATEGORY_INTENT]).toBeTruthy();
    }
  });

  it("groups the 'investing in myself' categories correctly", () => {
    expect(CATEGORY_INTENT.Books).toBe("Investing in myself");
    expect(CATEGORY_INTENT.Courses).toBe("Investing in myself");
    expect(CATEGORY_INTENT.Gym).toBe("Investing in myself");
  });

  it("groups bills/necessities as Responsibilities", () => {
    expect(CATEGORY_INTENT.Rent).toBe("Responsibilities");
    expect(CATEGORY_INTENT.Utilities).toBe("Responsibilities");
    expect(CATEGORY_INTENT.Insurance).toBe("Responsibilities");
    expect(CATEGORY_INTENT.Groceries).toBe("Responsibilities");
    expect(CATEGORY_INTENT.Transport).toBe("Responsibilities");
  });

  it("groups everyday enjoyment as Lifestyle", () => {
    expect(CATEGORY_INTENT.Dining).toBe("Lifestyle");
    expect(CATEGORY_INTENT.Coffee).toBe("Lifestyle");
    expect(CATEGORY_INTENT.Shopping).toBe("Lifestyle");
    expect(CATEGORY_INTENT.Entertainment).toBe("Lifestyle");
  });
});

describe("moneyForSpeech", () => {
  it("drops trailing .00 so TTS doesn't recite \"zero cents\"", () => {
    expect(moneyForSpeech(36700)).toBe("$367");
  });

  it("keeps real cents", () => {
    expect(moneyForSpeech(4250)).toBe("$42.50");
  });
});

describe("buildWallSpokenSummary", () => {
  const okVerdict: WallVerdict = { beforeCents: 41200, afterCents: 36700, dipsIntoGoalBy: 0, tone: "ok" };
  const warnVerdict: WallVerdict = { beforeCents: 41200, afterCents: 16200, dipsIntoGoalBy: 13800, tone: "warn" };

  it("reads an on-pace summary without a follow-up question", () => {
    const text = buildWallSpokenSummary("Fancy dinner", 4500, okVerdict, "This purchase keeps you on track.", 90);
    expect(text).toContain("Fancy dinner");
    expect(text).toContain("$45");
    expect(text).toContain("$367");
    expect(text).toContain("This purchase keeps you on track.");
    expect(text).not.toContain("Still want to continue?");
  });

  it("reads the same headline the screen shows, and asks to continue when the score is low", () => {
    const text = buildWallSpokenSummary(
      "Fancy dinner",
      25000,
      warnVerdict,
      "This purchase dips into Cushion by $138.",
      30
    );
    expect(text).toContain("This purchase dips into Cushion by $138.");
    expect(text).toContain("Still want to continue?");
  });

  it("still asks to continue for a real cash-flow shortfall even when verdict.tone is 'ok'", () => {
    // The exact inconsistency this was fixed for: a Financial Timeline
    // shortfall doesn't touch verdict.tone at all (that only reflects the
    // savings-goal check), so the low score must be what drives the
    // follow-up question, not verdict.tone.
    const text = buildWallSpokenSummary(
      "Fancy dinner",
      4500,
      okVerdict,
      "This leaves you short by $35.65 before Jul 23.",
      25
    );
    expect(text).toContain("This leaves you short by $35.65 before Jul 23.");
    expect(text).toContain("Still want to continue?");
  });
});
