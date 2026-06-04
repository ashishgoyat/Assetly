"use client";

/**
 * CurrencyContext — global currency state for monetary display.
 *
 * The provider receives the initial currency from the server (read from
 * the `assetly-currency` cookie). When the user changes their currency in
 * Settings, the new value is persisted to the cookie so it survives reload
 * and can be read server-side on the next request.
 *
 * Exchange rates are fetched once on mount from open.er-api.com (free, no
 * key). If the fetch fails, hardcoded fallback rates are used.
 */

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { formatCurrency, formatCurrencyExact, formatCompact } from "@/lib/format";

export type Currency = "USD" | "INR" | "EUR";

const FALLBACK_RATES: Record<Currency, number> = { USD: 1, INR: 84, EUR: 0.92 };

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  exchangeRate: number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

interface ProviderProps {
  children: React.ReactNode;
  initialCurrency: Currency;
}

export function CurrencyProvider({ children, initialCurrency }: ProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);

  const persistRatesToCookie = useCallback((r: Record<Currency, number>) => {
    const ratesJson = JSON.stringify({ USD: r.USD, INR: r.INR, EUR: r.EUR });
    document.cookie = `assetly-exchange-rates=${encodeURIComponent(ratesJson)}; path=/; max-age=86400; samesite=lax`;
  }, []);

  useEffect(() => {
    // Persist initial (fallback) rates immediately so the server has something to read.
    persistRatesToCookie(FALLBACK_RATES);

    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data: { result: string; rates: Record<string, number> }) => {
        if (data.result === "success") {
          const liveRates: Record<Currency, number> = {
            USD: data.rates["USD"] ?? 1,
            INR: data.rates["INR"] ?? FALLBACK_RATES.INR,
            EUR: data.rates["EUR"] ?? FALLBACK_RATES.EUR,
          };
          setRates(liveRates);
          persistRatesToCookie(liveRates);
        }
      })
      .catch(() => {
        // Keep fallback rates already set in initial state.
      });
  }, [persistRatesToCookie]);

  const setCurrency = useCallback(
    (c: Currency) => {
      setCurrencyState(c);
      // Persist via cookie so it survives reload and is readable server-side.
      document.cookie = `assetly-currency=${c}; path=/; max-age=31536000; samesite=lax`;
    },
    [],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate: rates[currency] }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): Currency {
  const ctx = useContext(CurrencyContext);
  return ctx?.currency ?? "USD";
}

export function useSetCurrency(): (c: Currency) => void {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useSetCurrency must be used inside CurrencyProvider");
  return ctx.setCurrency;
}

export function useExchangeRate(): number {
  const ctx = useContext(CurrencyContext);
  return ctx?.exchangeRate ?? 1;
}

export function useFormatCurrency() {
  const currency = useCurrency();
  const rate = useExchangeRate();
  return {
    fmt:       (cents: number) => formatCurrency(cents, currency, rate),
    fmtExact:  (cents: number) => formatCurrencyExact(cents, currency, rate),
    fmtCompact:(cents: number) => formatCompact(cents, currency, rate),
  };
}
