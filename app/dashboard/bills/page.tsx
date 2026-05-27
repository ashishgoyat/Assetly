/**
 * Bills & Subscriptions page — Server Component
 */

import Icon from "@/app/components/ui/Icon";
import type { BillsSummary } from "@/contracts/api-contracts";
import { MOCK_BILLS } from "@/lib/mock-data";
import { formatCurrency, formatCurrencyExact } from "@/lib/format";
import AddBillButton from "@/app/dashboard/bills/AddBillButton";

async function getBillsData(): Promise<BillsSummary> {
  try {
    // TODO: awaiting backend — expects GET /api/bills, see contracts/api-contracts.ts
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/bills`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data as BillsSummary;
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
    console.error("[bills] API not available, using mock data:", err);
    return MOCK_BILLS;
  }
}

export default async function BillsPage() {
  const data = await getBillsData();
  const {
    totalDueNext30DaysInCents,
    totalSubsMonthlyInCents,
    bills,
    subscriptions,
    savingsOpportunityInCents,
    savingsOpportunityNote,
  } = data;

  const unusedSubs = subscriptions.filter((s) => !s.isUsed);

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
            Bills &amp; subscriptions
          </h1>
          <div className="muted" style={{ marginTop: 4 }}>
            {formatCurrency(totalDueNext30DaysInCents)} due in next 30 days
          </div>
        </div>
        <AddBillButton />
      </div>

      <div className="grid-2col-bills-alt">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Timeline */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div>
                <div className="sec-label">Next 30 days</div>
                <div
                  className="serif num"
                  style={{ fontSize: 32, marginTop: 6 }}
                >
                  {formatCurrency(totalDueNext30DaysInCents)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {["30d", "60d", "90d"].map((p, i) => (
                  <button
                    key={p}
                    className="btn btn-sm btn-ghost"
                    style={{
                      background: i === 0 ? "var(--bg-soft)" : undefined,
                      fontWeight: i === 0 ? 600 : 400,
                    }}
                    type="button"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual timeline */}
            <div
              style={{ position: "relative", height: 84, marginTop: 12 }}
              aria-label="Bill due dates timeline"
            >
              {/* Base line */}
              <div
                style={{
                  position: "absolute",
                  top: 24,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "var(--border)",
                }}
                aria-hidden
              />
              {/* Date labels */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--f-mono)",
                  fontSize: 9.5,
                  color: "var(--ink-4)",
                }}
                aria-hidden
              >
                {["Apr 23", "Apr 30", "May 7", "May 14", "May 21"].map(
                  (d) => (
                    <span key={d}>{d}</span>
                  )
                )}
              </div>
              {/* Markers */}
              {bills.map((b) => {
                const pos = Math.min((b.dueInDays / 30) * 100, 98);
                return (
                  <div
                    key={b.id}
                    style={{
                      position: "absolute",
                      left: `calc(${pos}% - 4px)`,
                      top: 16,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                    title={`${b.name}: ${formatCurrency(b.amountInCents)} due ${b.dueDate}`}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: b.isUrgent ? "var(--accent)" : b.color,
                        border: "2px solid var(--surface)",
                        boxShadow: "0 0 0 1px var(--border)",
                      }}
                      aria-hidden
                    />
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 10,
                        fontFamily: "var(--f-mono)",
                        color: "var(--ink-3)",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        maxWidth: 60,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      aria-hidden
                    >
                      {formatCurrency(b.amountInCents)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming bills list */}
          <div className="card" style={{ padding: 8 }}>
            <div
              style={{
                padding: "12px 14px 8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Upcoming bills
              </div>
              <div className="muted" style={{ fontSize: 11.5 }}>
                {bills.length} total
              </div>
            </div>
            {bills.map((b) => (
              <div
                key={b.id}
                className="tx-row"
                style={{ gridTemplateColumns: "48px 1fr auto auto" }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: b.isUrgent ? "var(--accent)" : "var(--bg-soft)",
                    color: b.isUrgent ? "white" : "var(--ink-2)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                  aria-label={b.dueDate}
                >
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      opacity: 0.85,
                    }}
                  >
                    {b.dueDate.split(" ")[0]}
                  </span>
                  <span
                    className="num"
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {b.dueDate.split(" ")[1]}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{b.name}</div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--ink-3)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 3,
                    }}
                  >
                    {b.isAutoPay ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          color: "var(--pos)",
                        }}
                      >
                        <Icon name="check" size={11} /> Auto-pay set
                      </span>
                    ) : (
                      <span className="pill pill-warn">Needs scheduling</span>
                    )}
                    <span className="dim">·</span>
                    <span>{b.category}</span>
                  </div>
                </div>
                <div
                  className="num"
                  style={{ fontSize: 17, fontWeight: 600 }}
                >
                  {formatCurrency(b.amountInCents)}
                </div>
                <button className="btn btn-sm" type="button">
                  {b.isAutoPay ? "View" : "Pay"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Subscriptions */}
          <div className="card" style={{ padding: 22 }}>
            <div className="sec-label">Subscriptions</div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                marginTop: 6,
              }}
            >
              <span
                className="serif num"
                style={{ fontSize: 36, lineHeight: 1 }}
              >
                {formatCurrencyExact(totalSubsMonthlyInCents)}
              </span>
              <span className="muted">/ month</span>
            </div>
            <div
              className="muted"
              style={{ fontSize: 12, marginTop: 4 }}
            >
              {formatCurrency(totalSubsMonthlyInCents * 12)}/year ·{" "}
              {subscriptions.length} active
            </div>

            <div className="div" style={{ margin: "16px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {subscriptions.map((s) => (
                <div
                  key={s.id}
                  className="tx-row"
                  style={{
                    gridTemplateColumns: "32px 1fr auto",
                    padding: "8px 6px",
                  }}
                >
                  <div
                    className="merchant-icon"
                    style={{ background: s.color + "20", color: s.color }}
                    aria-hidden
                  >
                    <Icon name={s.icon as "music"} size={15} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {s.name}
                      {!s.isUsed && (
                        <span
                          className="pill pill-warn"
                          style={{ fontSize: 9.5 }}
                        >
                          unused
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                      next · {s.nextDate}
                    </div>
                  </div>
                  <div
                    className="num"
                    style={{ fontSize: 13, fontWeight: 600 }}
                  >
                    {formatCurrencyExact(s.amountMonthlyInCents)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save money insight */}
          {savingsOpportunityInCents !== undefined && (
            <div
              className="card"
              style={{
                padding: 18,
                background:
                  "linear-gradient(180deg, var(--accent-tint), var(--surface) 80%)",
                borderColor: "var(--accent-soft)",
              }}
            >
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "var(--accent)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-hidden
                >
                  <Icon name="info" size={14} stroke={2} />
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13.5,
                    alignSelf: "center",
                  }}
                >
                  Save {formatCurrency(savingsOpportunityInCents)}/mo
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ink-2)",
                  lineHeight: 1.5,
                }}
              >
                {savingsOpportunityNote ??
                  (unusedSubs.length > 0
                    ? `You haven't used ${unusedSubs.map((s) => s.name).join(" and ")}. Cancel to save ${formatCurrency(savingsOpportunityInCents)}/mo.`
                    : "")}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-sm btn-accent" type="button">
                  Review subs
                </button>
                <button className="btn btn-sm btn-ghost" type="button">
                  Keep all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
