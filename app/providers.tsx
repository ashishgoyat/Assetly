"use client";

import { ThemeProvider } from "next-themes";
import {
  CurrencyProvider,
  type Currency,
} from "@/app/contexts/CurrencyContext";

export default function Providers({
  children,
  initialCurrency,
}: {
  children: React.ReactNode;
  initialCurrency: Currency;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <CurrencyProvider initialCurrency={initialCurrency}>
        {children}
      </CurrencyProvider>
    </ThemeProvider>
  );
}
