/**
 * Insights page — Server Component
 */

import Link from "next/link";
import Icon from "@/app/components/ui/Icon";
import Sparkline from "@/app/components/charts/Sparkline";
import type { Insight } from "@/contracts/api-contracts";
import { MOCK_INSIGHTS } from "@/lib/mock-data";

async function getInsightsData(): Promise<Insight[]> {
  try {
    // TODO: awaiting backend — expects GET /api/insights, see contracts/api-contracts.ts
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/insights`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data as Insight[];
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
    console.error("[insights] API not available, using mock data:", err);
    return MOCK_INSIGHTS;
  }
}

type ToneKey = "pos" | "warn" | "neutral";

const TONE_STYLES: Record<ToneKey, { bg: string; ic: string }> = {
  pos:     { bg: "var(--pos-soft)",  ic: "var(--pos)" },
  warn:    { bg: "var(--warn-soft)", ic: "var(--warn)" },
  neutral: { bg: "var(--bg-soft)",   ic: "var(--ink)" },
};

export default async function InsightsPage() {
  const insights = await getInsightsData();
  const pinned = insights.find((i) => i.isPinned);
  const cards = insights.filter((i) => !i.isPinned);

  return (
    <div className="page-content">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <div>
          <h1
            className="serif"
            style={{ fontSize: 40, margin: 0, lineHeight: 1.05 }}
          >
            Insights
          </h1>
          <div className="muted" style={{ marginTop: 4 }}>
            What we noticed about your money this month
          </div>
        </div>
        <button className="btn btn-sm" type="button">
          April <Icon name="chevd" size={11} />
        </button>
      </div>

      {/* Pinned insight */}
      {pinned && (
        <div
          className="card grid-insight-pinned"
          style={{
            padding: 28,
            marginBottom: 18,
            background:
              "linear-gradient(135deg, var(--accent-tint), var(--surface) 60%)",
            borderColor: "var(--accent-soft)",
            alignItems: "center",
          }}
          aria-label={`Featured insight: ${pinned.title}`}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--accent)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-hidden
              >
                <Icon name="sparkle" size={18} stroke={2} />
              </div>
              <div
                className="sec-label"
                style={{ color: "var(--accent-2)" }}
              >
                {pinned.tag}
              </div>
            </div>
            <div
              className="serif"
              style={{
                fontSize: 30,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: 8,
              }}
            >
              {pinned.title}
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--ink-2)",
                lineHeight: 1.5,
                maxWidth: 480,
              }}
            >
              {pinned.body}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Link href="/dashboard/goals" className="btn btn-accent">
                {pinned.cta} <Icon name="arrowR" size={13} />
              </Link>
              <Link href="/dashboard/goals" className="btn">
                Adjust goal
              </Link>
            </div>
          </div>

          {pinned.sparklineData && (
            <div>
              <div
                className="muted"
                style={{ fontSize: 11, marginBottom: 6 }}
              >
                Savings rate · last {pinned.sparklineData.length} mo
              </div>
              <Sparkline
                data={pinned.sparklineData}
                w={180}
                h={70}
                color="var(--accent)"
                filled
              />
              <div
                className="num serif"
                style={{
                  fontSize: 32,
                  marginTop: 6,
                  color: "var(--accent-2)",
                }}
              >
                {pinned.sparklineData[pinned.sparklineData.length - 1]}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights grid */}
      {cards.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--ink-3)",
          }}
        >
          <Icon name="sparkle" size={32} color="var(--ink-4)" />
          <div style={{ marginTop: 12, fontWeight: 600 }}>No insights yet</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            Keep using Assetly and we&apos;ll surface patterns in your spending.
          </div>
        </div>
      ) : (
        <div className="grid-3col-insights">
          {cards.map((c) => {
            const tone = (c.tone as ToneKey) in TONE_STYLES ? (c.tone as ToneKey) : "neutral";
            const tm = TONE_STYLES[tone];
            return (
              <article key={c.id} className="card" style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: tm.bg,
                      color: tm.ic,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-hidden
                  >
                    <Icon name={c.glyph as "trend"} size={14} stroke={2} />
                  </div>
                  <div className="sec-label">{c.tag}</div>
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 8,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {c.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ink-2)",
                    lineHeight: 1.5,
                    marginBottom: 16,
                  }}
                >
                  {c.body}
                </div>
                <Link href="/dashboard/transactions" className="btn btn-sm">
                  {c.cta} <Icon name="chev" size={11} />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
