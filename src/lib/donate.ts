// Payment setup lives here. Set NEXT_PUBLIC_DONATE_URL (a hosted checkout or
// donation page) to turn the Donate button on; until then it points people to
// the contact form instead of a dead link. Bank details, if you want them
// shown, go in `bank`.
export const DONATE = {
  url: process.env.NEXT_PUBLIC_DONATE_URL ?? "",
  currency: process.env.NEXT_PUBLIC_DONATE_CURRENCY ?? "USD",
  amounts: [5, 10, 25, 50, 100],
  defaultAmount: 25,
  maxAmount: 10000,
  bank: null as null | { bank: string; accountName: string; accountNumber: string; note?: string },
};

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: DONATE.currency, maximumFractionDigits: 0 }).format(amount);
