/**
 * Formatting utilities for Assetly.
 * All monetary inputs must be in cents (smallest currency unit).
 * Never do math on formatted strings.
 */

export function formatCurrency(cents: number, currency = "USD", rate = 1): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format((cents * rate) / 100);
}

export function formatCurrencyExact(cents: number, currency = "USD", rate = 1): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((cents * rate) / 100);
}

export function formatCompact(cents: number, currency = "USD", rate = 1): string {
  const amount = (cents * rate) / 100;
  if (Math.abs(amount) >= 1_000_000)
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 1 }).format(amount / 1_000_000) + "M";
  if (Math.abs(amount) >= 1_000)
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 1 }).format(amount / 1_000) + "k";
  return formatCurrency(cents, currency, rate);
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}
