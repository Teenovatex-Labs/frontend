// Donations run through HCB (Hack Club's fiscal sponsorship). The `amount`
// query param is read in cents, `monthly=true` switches to a recurring gift,
// and `utm_source` lets HCB attribute the gift to this site.
const HCB_URL = "https://hcb.hackclub.com/donations/start/teenovatex-labs";

export const DONATE = {
  currency: "USD",
  amounts: [5, 10, 25, 50, 100],
  defaultAmount: 25,
  maxAmount: 10000,
  orgPage: "https://hcb.hackclub.com/teenovatex-labs",
};

export const donateUrl = (amount: number, monthly: boolean) => {
  const params = new URLSearchParams({ amount: String(Math.round(amount * 100)), utm_source: "teenovatex.org" });
  if (monthly) params.set("monthly", "true");
  return `${HCB_URL}?${params.toString()}`;
};

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: DONATE.currency, maximumFractionDigits: 0 }).format(amount);
