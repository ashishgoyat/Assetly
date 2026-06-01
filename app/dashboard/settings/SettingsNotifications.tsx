"use client";

import { useState } from "react";
import type { NotificationPreferences } from "@/contracts/api-contracts";
import { updateNotificationPrefs, sendTestNotificationEmail } from "@/app/dashboard/settings/actions";

interface ToggleRowProps {
  label: string;
  sub: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ label, sub, checked, onChange }: ToggleRowProps) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 0",
        }}
      >
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {sub}
          </div>
        </div>
        <label className="toggle-wrap" aria-label={label}>
          <span className="toggle">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              aria-label={label}
            />
            <span className="toggle-track" />
            <span className="toggle-thumb" />
          </span>
        </label>
      </div>
    </div>
  );
}

const ROWS: { label: string; sub: string; key: keyof NotificationPreferences }[] = [
  { label: "Bills due", sub: "3 days notice before a bill is due", key: "billsDue" },
  { label: "Budget exceeded", sub: "Alert when a category goes over its budget limit", key: "budgetExceeded" },
  { label: "Large transactions", sub: "Alert for transactions above your set threshold", key: "largeTransactions" },
  { label: "Weekly digest", sub: "Weekly summary of spending and savings", key: "weeklyDigest" },
  { label: "Goal milestones", sub: "Alert when a savings goal hits a milestone", key: "goalMilestones" },
];

export default function SettingsNotifications({ initialPrefs }: { initialPrefs: NotificationPreferences }) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPrefs);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function handleToggle(key: keyof NotificationPreferences, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    updateNotificationPrefs(next).catch(() => {});
  }

  async function handleTestEmail() {
    setTesting(true);
    setTestResult(null);
    const result = await sendTestNotificationEmail();
    setTesting(false);
    setTestResult({ ok: result.success, msg: result.success ? result.message! : result.error });
    setTimeout(() => setTestResult(null), 6000);
  }

  return (
    <div>
      {ROWS.map((row, i) => (
        <div key={row.key}>
          <ToggleRow
            label={row.label}
            sub={row.sub}
            checked={prefs[row.key]}
            onChange={(v) => handleToggle(row.key, v)}
          />
          {i < ROWS.length - 1 && <div className="div" />}
        </div>
      ))}

      <div className="div" style={{ marginTop: 4 }} />

      <div style={{ paddingTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-sm"
          onClick={handleTestEmail}
          disabled={testing}
          aria-busy={testing}
        >
          {testing ? "Sending…" : "Send test email"}
        </button>
        {testResult && (
          <span
            style={{
              fontSize: 12.5,
              color: testResult.ok ? "var(--pos)" : "var(--neg)",
            }}
          >
            {testResult.msg}
          </span>
        )}
      </div>
    </div>
  );
}
