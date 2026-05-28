"use client";

// TODO: PATCH /api/settings — wire up onChange handlers once the endpoint is live.
// Each toggle fires an optimistic update, then sends the full notifications object
// as the request body. See contracts/api-contracts.ts → NotificationPreferences.

interface ToggleRowProps {
  label: string;
  sub: string;
  defaultChecked: boolean;
}

function ToggleRow({ label, sub, defaultChecked }: ToggleRowProps) {
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
              defaultChecked={defaultChecked}
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

const NOTIFICATION_ROWS: ToggleRowProps[] = [
  {
    label: "Bills due",
    sub: "3 days notice before a bill is due",
    defaultChecked: true,
  },
  {
    label: "Budget exceeded",
    sub: "Alert when a category goes over its budget limit",
    defaultChecked: true,
  },
  {
    label: "Large transactions",
    sub: "Alert for transactions above your set threshold",
    defaultChecked: false,
  },
  {
    label: "Weekly digest",
    sub: "Weekly summary of spending and savings",
    defaultChecked: true,
  },
  {
    label: "Goal milestones",
    sub: "Alert when a savings goal hits a milestone",
    defaultChecked: true,
  },
];

export default function SettingsNotifications() {
  return (
    <div>
      {NOTIFICATION_ROWS.map((row, i) => (
        <div key={row.label}>
          <ToggleRow {...row} />
          {i < NOTIFICATION_ROWS.length - 1 && <div className="div" />}
        </div>
      ))}
    </div>
  );
}
