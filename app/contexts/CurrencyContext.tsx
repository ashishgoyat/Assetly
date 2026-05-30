"use client";

/**
 * CurrencyContext — global currency state for monetary display.
 *
 * The provider receives the initial currency from the server (read from
 * the `assetly-currency` cookie). When the user changes their currency in
 * Settings, the new value is persisted to the cookie so it survives reload
 * and can be read server-side on the next request.
 */

import { createContext, useContext, useState, useCallback } from "react";

export type Currency = "USD" | "INR" | "EUR";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

interface ProviderProps {
  children: React.ReactNode;
  initialCurrency: Currency;
}

export function CurrencyProvider({ children, initialCurrency }: ProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    // Persist via cookie so it survives reload and is readable server-side.
    document.cookie = `assetly-currency=${c}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
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
