/**
 * MerchantIcon — Server Component
 * Maps merchant names to icons and brand colors.
 */

import Icon, { type IconName } from "@/app/components/ui/Icon";

interface MerchantEntry {
  ic: IconName;
  c: string;
}

const MERCHANT_ICONS: Record<string, MerchantEntry> = {
  "Trader Joe's":  { ic: "cart",    c: "#d97a52" },
  "Whole Foods":   { ic: "cart",    c: "#5a8a6a" },
  "Spotify":       { ic: "music",   c: "#1db954" },
  "Netflix":       { ic: "play",    c: "#c44545" },
  "Uber":          { ic: "car",     c: "#1c1a16" },
  "Lyft":          { ic: "car",     c: "#c54579" },
  "Coffee Bar":    { ic: "coffee",  c: "#8c6f4e" },
  "Amazon":        { ic: "bag",     c: "#ff9900" },
  "Paycheck":      { ic: "arrowUp", c: "#2f7a52" },
  "Rent":          { ic: "home",    c: "#c96442" },
  "Venmo":         { ic: "arrowR",  c: "#3d95ce" },
  "Venmo · Sam":   { ic: "arrowR",  c: "#3d95ce" },
  "AMC Theaters":  { ic: "play",    c: "#c44545" },
  "Verizon":       { ic: "bill",    c: "#cd040a" },
  "Subway":        { ic: "cart",    c: "#5a8a6a" },
  "Vending":       { ic: "coffee",  c: "#8c6f4e" },
  "Interest":      { ic: "arrowUp", c: "#2f7a52" },
};

interface MerchantIconProps {
  name: string;
  size?: number;
}

export default function MerchantIcon({ name, size = 32 }: MerchantIconProps) {
  const key = name?.split(" · ")[0] ?? "";
  const entry: MerchantEntry =
    MERCHANT_ICONS[name] ?? MERCHANT_ICONS[key] ?? { ic: "bag", c: "var(--ink-3)" };

  return (
    <div
      className="merchant-icon"
      style={{
        width: size,
        height: size,
        background: entry.c + "20",
        color: entry.c,
      }}
      aria-hidden
    >
      <Icon name={entry.ic} size={Math.round(size * 0.5)} />
    </div>
  );
}
