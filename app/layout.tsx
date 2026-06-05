import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import { cookies } from "next/headers";
import Providers from "@/app/providers";
import type { Currency } from "@/app/contexts/CurrencyContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFECE7" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

export const metadata: Metadata = {
  title: "Assetly",
  description: "Personal finance dashboard",
};

const VALID_CURRENCIES: Currency[] = ["USD", "INR", "EUR"];

async function getInitialCurrency(): Promise<Currency> {
  const c = (await cookies()).get("assetly-currency")?.value;
  return VALID_CURRENCIES.includes(c as Currency) ? (c as Currency) : "USD";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialCurrency = await getInitialCurrency();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers initialCurrency={initialCurrency}>{children}</Providers>
      </body>
    </html>
  );
}
