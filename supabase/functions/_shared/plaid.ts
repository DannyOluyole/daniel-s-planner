/**
 * Minimal Plaid REST client for Deno edge functions. Deliberately dependency-
 * free — just fetch against Plaid's HTTP API — since Deno Edge Functions
 * have a small, curated set of npm specifiers that work reliably.
 *
 * Required env (set via `supabase secrets set`, never EXPO_PUBLIC_*):
 *   PLAID_CLIENT_ID
 *   PLAID_SECRET
 *   PLAID_ENV        one of "sandbox" | "development" | "production"
 */

const PLAID_ENV_URLS: Record<string, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};

function baseUrl(): string {
  const env = Deno.env.get("PLAID_ENV") ?? "sandbox";
  return PLAID_ENV_URLS[env] ?? PLAID_ENV_URLS.sandbox;
}

function credentials() {
  return {
    client_id: Deno.env.get("PLAID_CLIENT_ID") ?? "",
    secret: Deno.env.get("PLAID_SECRET") ?? "",
  };
}

async function plaidFetch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...credentials(), ...body }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_message ?? `Plaid request to ${path} failed`);
  }
  return data;
}

export interface PlaidAccount {
  account_id: string;
  name: string;
  type: string; // "depository" | "investment" | "credit" | "loan"
  subtype: string | null;
  balances: {
    available: number | null;
    current: number | null;
  };
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number; // positive = money out, negative = money in (Plaid convention)
  merchant_name: string | null;
  name: string; // fallback label when merchant_name is missing
  personal_finance_category?: { primary: string } | null;
  category?: string[] | null;
  pending: boolean;
  date: string; // YYYY-MM-DD
}

export interface TransactionsSyncPage {
  added: PlaidTransaction[];
  modified: PlaidTransaction[];
  removed: { transaction_id: string }[];
  next_cursor: string;
  has_more: boolean;
}

export const plaid = {
  createLinkToken(userId: string) {
    return plaidFetch("/link/token/create", {
      user: { client_user_id: userId },
      client_name: "Checkpoint",
      products: ["transactions"],
      country_codes: ["US"],
      language: "en",
      android_package_name: "com.checkpoint.app",
    }) as Promise<{ link_token: string }>;
  },

  exchangePublicToken(publicToken: string) {
    return plaidFetch("/item/public_token/exchange", {
      public_token: publicToken,
    }) as Promise<{ access_token: string; item_id: string }>;
  },

  getBalances(accessToken: string) {
    return plaidFetch("/accounts/balance/get", {
      access_token: accessToken,
    }) as Promise<{ accounts: PlaidAccount[] }>;
  },

  syncTransactions(accessToken: string, cursor: string | null) {
    return plaidFetch("/transactions/sync", {
      access_token: accessToken,
      ...(cursor ? { cursor } : {}),
      count: 500,
    }) as Promise<TransactionsSyncPage>;
  },

  removeItem(accessToken: string) {
    return plaidFetch("/item/remove", {
      access_token: accessToken,
    }) as Promise<{ removed: boolean }>;
  },
};
