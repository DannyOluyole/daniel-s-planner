/** Plaid's personal_finance_category comes back as SCREAMING_SNAKE_CASE
 * (e.g. "FOOD_AND_DRINK") — this turns it into normal prose casing. */
export function humanizeCategory(category?: string | null): string | undefined {
  if (!category) return undefined;
  return category
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
