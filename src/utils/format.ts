import type { Currency } from "../domain/types";

export function formatCurrency(amount: number, currency: Currency) {
  const locale = currency === "AMD" ? "hy" : currency === "EUR" ? "de-DE" : "en-US";
  const opts: Intl.NumberFormatOptions = { style: "currency", currency };
  return new Intl.NumberFormat(locale, opts).format(amount);
}
