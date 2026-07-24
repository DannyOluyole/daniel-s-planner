import { WallVerdict } from "./applyPurchase";
import { CategoryBudgetImpact } from "./categoryImpact";

export const CATEGORIES = [
  "Dining",
  "Groceries",
  "Shopping",
  "Entertainment",
  "Transport",
  "Coffee",
  "Books",
  "Courses",
  "Gym",
  "Rent",
  "Utilities",
  "Insurance",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Which broader intent each category speaks to — "did this purchase build
 * toward something, keep life running day to day, or cover what's already
 * owed" reads as more meaningful than a flat category list on its own. See
 * categoryImpact.ts's summarizeIntentThisMonth for the aggregate this feeds. */
export type Intent = "Investing in myself" | "Lifestyle" | "Responsibilities" | "Other";

export const CATEGORY_INTENT: Record<Category, Intent> = {
  Dining: "Lifestyle",
  Groceries: "Responsibilities",
  Shopping: "Lifestyle",
  Entertainment: "Lifestyle",
  Transport: "Responsibilities",
  Coffee: "Lifestyle",
  Books: "Investing in myself",
  Courses: "Investing in myself",
  Gym: "Investing in myself",
  Rent: "Responsibilities",
  Utilities: "Responsibilities",
  Insurance: "Responsibilities",
  Other: "Other",
};

const CATEGORY_KEYWORDS: Record<Exclude<Category, "Other">, string[]> = {
  Dining: ["dinner", "lunch", "breakfast", "restaurant", "cafe", "café", "takeout", "takeaway", "bar", "drinks"],
  Groceries: ["groceries", "grocery", "supermarket", "market"],
  Shopping: ["shoes", "clothes", "clothing", "shopping", "mall", "amazon", "store"],
  Entertainment: ["movie", "movies", "concert", "netflix", "spotify", "game", "games", "ticket", "tickets"],
  Transport: ["gas", "uber", "lyft", "taxi", "train", "transit", "parking", "fuel"],
  Coffee: ["coffee", "latte", "espresso", "cappuccino", "starbucks"],
  Books: ["book", "books", "novel", "textbook", "audiobook"],
  Courses: ["course", "class", "workshop", "tuition", "masterclass"],
  Gym: ["gym", "yoga", "fitness", "workout", "personal trainer"],
  Rent: ["rent"],
  // Deliberately no "gas" here — Transport already claims that word, and
  // category detection returns on the first array-order match, so an
  // overlapping keyword here would never actually be reached.
  Utilities: ["electricity", "electric bill", "water bill", "internet bill", "wifi bill", "utility", "utilities"],
  Insurance: ["insurance", "premium"],
};

const ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

// Bounded to actual number words (plus "hundred"/"and") so the match can't
// swallow preceding filler words — a plain [a-z]+ run would happily capture
// "i'd like to buy coffee for forty five" instead of just "forty five".
const NUMBER_WORD_PATTERN = [...Object.keys(ONES), ...Object.keys(TENS), "hundred", "and"].join("|");
const WORD_NUMBER_REGEX = new RegExp(
  `\\b((?:(?:${NUMBER_WORD_PATTERN})\\s*)+)(dollars?|bucks)\\b`,
  "i"
);

const FILLER_PREFIXES = [
  /^i('| a)?m buying\s+/i,
  /^i want to buy\s+/i,
  /^i'd like to buy\s+/i,
  /^buy\s+/i,
  /^buying\s+/i,
  /^purchase\s+/i,
  /^purchasing\s+/i,
  /^get\s+/i,
  /^log\s+/i,
];

/** Converts a run of number words ("forty five", "one hundred and twenty") to a value. */
function wordsToNumber(words: string[]): number | null {
  let total = 0;
  let current = 0;
  let matchedAny = false;

  for (const raw of words) {
    const w = raw.replace(/,/g, "");
    if (w === "and") continue;
    if (w === "hundred") {
      current = (current || 1) * 100;
      matchedAny = true;
      continue;
    }
    if (w in ONES) {
      current += ONES[w];
      matchedAny = true;
      continue;
    }
    if (w in TENS) {
      current += TENS[w];
      matchedAny = true;
      continue;
    }
    // Unknown word ends the number run.
    break;
  }
  total += current;
  return matchedAny ? total : null;
}

/**
 * Pulls a dollar amount out of a spoken transcript. Prefers explicit
 * digits ("$45", "45 dollars") since that's what most speech engines
 * already return (Chrome normalizes spoken numbers to digits), and falls
 * back to spelled-out numbers ("forty five dollars") for engines that don't.
 */
function extractAmountCents(transcript: string): { amountCents: number | null; matched: string } {
  const digitMatch = transcript.match(
    /\$\s?(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:dollars?|bucks)\b/i
  );
  if (digitMatch) {
    const numStr = digitMatch[1] ?? digitMatch[2];
    return { amountCents: Math.round(parseFloat(numStr) * 100), matched: digitMatch[0] };
  }

  const wordMatch = transcript.match(WORD_NUMBER_REGEX);
  if (wordMatch) {
    const words = wordMatch[1].trim().toLowerCase().split(/\s+/);
    const value = wordsToNumber(words);
    if (value != null) {
      return { amountCents: Math.round(value * 100), matched: wordMatch[0] };
    }
  }

  return { amountCents: null, matched: "" };
}

function detectCategory(transcript: string): Category {
  const lower = transcript.toLowerCase();
  for (const category of CATEGORIES) {
    if (category === "Other") continue;
    const keywords = CATEGORY_KEYWORDS[category];
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return "Other";
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export interface ParsedPurchase {
  merchant: string;
  amountCents: number | null;
  category: Category;
}

/**
 * Turns a spoken sentence like "I want to buy dinner for 45 dollars" into
 * structured purchase fields. Deliberately simple pattern matching rather
 * than an LLM call — it runs instantly, offline, and its failure mode is
 * "leaves the field blank for the user to fill in", never a wrong guess
 * about someone's money.
 */
export function parsePurchaseSpeech(transcript: string): ParsedPurchase {
  const trimmed = transcript.trim();
  const { amountCents, matched } = extractAmountCents(trimmed);

  let remainder = matched ? trimmed.replace(matched, " ") : trimmed;
  for (const prefix of FILLER_PREFIXES) {
    remainder = remainder.replace(prefix, "");
  }
  remainder = remainder
    .replace(/\bfor\b/gi, " ")
    .replace(/\bat\b/gi, " ")
    .replace(/\bon\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const merchant = remainder ? titleCase(remainder) : titleCase(trimmed);
  const category = detectCategory(trimmed);

  return { merchant, amountCents, category };
}

/**
 * Formats cents for a voice to read, not an eye to scan: drops the ".00"
 * TTS engines otherwise stumble over ("three hundred sixty-seven dollars
 * zero cents") and keeps real cents when they matter.
 */
export function moneyForSpeech(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const remainder = abs % 100;
  return remainder === 0 ? `${sign}$${whole}` : `${sign}$${whole}.${String(remainder).padStart(2, "0")}`;
}

/**
 * Composes the sentence read back on the Spending Wall — same numbers as
 * the on-screen ledger, worded the way someone would actually say it out
 * loud rather than a screen-reader recitation of the ledger rows. Takes the
 * already-computed narrative headline and score rather than re-deriving its
 * own tone from `verdict` alone — `verdict.tone` only reflects the
 * savings-goal check, not a real Financial Timeline shortfall, so re-deriving
 * separately could have this cheerfully say "you're in good shape" while the
 * screen itself was warning about a real cash-flow problem.
 */
export function buildWallSpokenSummary(
  merchant: string,
  amountCents: number,
  verdict: WallVerdict,
  narrativeHeadline: string,
  narrativeScore: number,
  categoryImpact?: CategoryBudgetImpact | null
): string {
  const amount = moneyForSpeech(amountCents);
  const after = moneyForSpeech(verdict.afterCents);

  const budgetPart = categoryImpact
    ? categoryImpact.overBy > 0
      ? ` And it puts your ${categoryImpact.category} budget over by ${moneyForSpeech(categoryImpact.overBy)}.`
      : ` Your ${categoryImpact.category} budget stays on track.`
    : "";

  // Below "Good decision" territory (see decisionNarrative.ts's own bands)
  // — the same threshold the screen uses to read as a caution, not just a
  // plain confirmation.
  const isConcern = narrativeScore < 60 || (categoryImpact && categoryImpact.overBy > 0);
  const question = isConcern ? " Still want to continue?" : "";

  return `That's ${amount} for ${merchant}. Go ahead, and you'll have ${after} left. ${narrativeHeadline}${budgetPart}${question}`;
}
