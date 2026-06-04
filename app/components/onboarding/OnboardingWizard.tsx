"use client";

/**
 * OnboardingWizard — shown to new users who have no accounts.
 *
 * Detection (on mount):
 *   1. Read the `assetly-onboarding-done` cookie — if set, render nothing.
 *   2. Fetch GET /api/accounts — if the array is non-empty, render nothing.
 *   3. Otherwise show the 4-step wizard modal.
 *
 * Cookie helpers live here because this is the only place that needs them.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AddAccountForm from "@/app/components/forms/AddAccountForm";
import { useExitAnimation, MOTION_MS } from "@/app/hooks/useExitAnimation";

// ─── Cookie helpers ──────────────────────────────────────────────────────────

const COOKIE_NAME = "assetly-onboarding-done";
const COOKIE_MAX_AGE = 31536000; // 1 year in seconds

function isOnboardingDone(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
}

function markOnboardingDone(): void {
  document.cookie = `${COOKIE_NAME}=1; max-age=${COOKIE_MAX_AGE}; path=/`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

type WizardStatus = "checking" | "show" | "hidden";

// ─── Progress dots ───────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: Step }) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={4}
      aria-label={`Step ${step} of 4`}
    >
      {([1, 2, 3, 4] as Step[]).map((n) => (
        <span
          key={n}
          style={{
            width: n === step ? 20 : 8,
            height: 8,
            borderRadius: 999,
            background:
              n === step
                ? "var(--ink)"
                : n < step
                  ? "var(--ink-3)"
                  : "var(--border)",
            transition:
              "width var(--dur-base) var(--ease-out-quart), background var(--dur-fast) var(--ease-out-quart)",
            display: "inline-block",
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ─── Step 1 — Welcome ────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center" style={{ gap: 20 }}>
      {/* Illustration — a simple layered coins icon using CSS */}
      <div
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--accent-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginTop: 8,
        }}
      >
        💰
      </div>

      <div style={{ gap: 10, display: "flex", flexDirection: "column" }}>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          Welcome to Assetly
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--ink-3)",
            lineHeight: 1.6,
            maxWidth: 360,
          }}
        >
          Track your money, hit your goals, and stay on top of bills. Let&apos;s
          get you set up in 4 steps.
        </p>
      </div>

      <div style={{ marginTop: 8, width: "100%" }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          style={{ width: "100%" }}
          onClick={onNext}
        >
          Get started
        </button>
      </div>
    </div>
  );
}

// ─── Step 2 — Choose currency ────────────────────────────────────────────────

type CurrencyCode = "USD" | "INR" | "EUR";

const CURRENCIES: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

const CURRENCY_COOKIE = "assetly-currency";
const CURRENCY_MAX_AGE = 31536000; // 1 year in seconds

function saveCurrencyCookie(currency: CurrencyCode): void {
  document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=${CURRENCY_MAX_AGE}; samesite=lax`;
}

function StepChooseCurrency({ onNext }: { onNext: (currency: CurrencyCode) => void }) {
  const [selected, setSelected] = useState<CurrencyCode>("USD");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          Choose your currency
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--ink-3)",
            lineHeight: 1.6,
          }}
        >
          This will be used as the default currency across your dashboard.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CURRENCIES.map(({ code, symbol, name }) => {
          const isSelected = selected === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setSelected(code)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 18px",
                borderRadius: 12,
                border: isSelected
                  ? "2px solid var(--accent)"
                  : "2px solid var(--border)",
                background: isSelected ? "var(--accent-soft)" : "var(--surface)",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color var(--dur-fast) var(--ease-out-quart), background var(--dur-fast) var(--ease-out-quart)",
              }}
              aria-pressed={isSelected}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: isSelected ? "var(--accent)" : "var(--border-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  color: isSelected ? "#fff" : "var(--ink)",
                  flexShrink: 0,
                  transition: "background var(--dur-fast) var(--ease-out-quart), color var(--dur-fast) var(--ease-out-quart)",
                }}
                aria-hidden="true"
              >
                {symbol}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--ink)",
                    lineHeight: 1.3,
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--ink-3)",
                    lineHeight: 1.3,
                  }}
                >
                  {code}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 8, width: "100%" }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          style={{ width: "100%" }}
          onClick={() => onNext(selected)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 — Add first account ──────────────────────────────────────────────

function StepAddAccount({
  onAccountAdded,
  onSkip,
}: {
  onAccountAdded: () => void;
  onSkip: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          Add your first account
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--ink-3)",
            lineHeight: 1.6,
          }}
        >
          Connect a bank account to start tracking your balance.
        </p>
      </div>

      {/*
       * AddAccountForm calls onClose when the account is successfully created.
       * We forward that to onAccountAdded so the wizard advances to step 4.
       */}
      <AddAccountForm onClose={onAccountAdded} />

      {/* Skip row — sits below the form's own actions row */}
      <div
        style={{
          borderTop: "1px solid var(--border-2)",
          paddingTop: 12,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onSkip}
          style={{ color: "var(--ink-3)" }}
        >
          Skip setup
        </button>
      </div>
    </div>
  );
}

// ─── Step 4 — All set ────────────────────────────────────────────────────────

function StepAllSet({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col items-center text-center" style={{ gap: 20 }}>
      <div
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--pos-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginTop: 8,
        }}
      >
        ✅
      </div>

      <div style={{ gap: 10, display: "flex", flexDirection: "column" }}>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          You&apos;re all set!
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--ink-3)",
            lineHeight: 1.6,
            maxWidth: 360,
          }}
        >
          Head to Goals to set a savings target, or Budgets to plan your
          spending.
        </p>
      </div>

      {/* Secondary action links */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Link href="/dashboard/goals" className="btn">
          Set a goal →
        </Link>
        <Link href="/dashboard/budgets" className="btn">
          Create a budget →
        </Link>
      </div>

      <div style={{ width: "100%" }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          style={{ width: "100%" }}
          onClick={onDone}
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Main wizard ─────────────────────────────────────────────────────────────

export default function OnboardingWizard() {
  // Lazy initializer: if the cookie is already set on the client, skip the
  // API fetch entirely and render nothing from the very first paint.
  const [status, setStatus] = useState<WizardStatus>(() =>
    isOnboardingDone() ? "hidden" : "checking",
  );
  const [step, setStep] = useState<Step>(1);
  // `open` drives the exit animation — set to false before unmounting
  const [open, setOpen] = useState(false);

  const { shouldRender, isExiting } = useExitAnimation(open, MOTION_MS.base);

  // On mount: if cookie was not set, check the API.
  // All setState calls are inside .then() / .catch() callbacks — never
  // synchronously in the effect body — so they don't violate the lint rule.
  useEffect(() => {
    // Already resolved by the lazy initializer — nothing to do.
    if (status !== "checking") return;

    let cancelled = false;

    fetch("/api/accounts", { credentials: "include" })
      .then((r) => r.json())
      .then((body: unknown) => {
        if (cancelled) return;
        // Contract: ApiResponse<Account[]> — data field is the array
        const accounts =
          body !== null &&
          typeof body === "object" &&
          "data" in (body as object) &&
          Array.isArray((body as { data: unknown }).data)
            ? (body as { data: unknown[] }).data
            : [];

        if (accounts.length > 0) {
          setStatus("hidden");
        } else {
          setStatus("show");
          setOpen(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // On fetch error, stay hidden — don't block the user
          setStatus("hidden");
        }
      });

    return () => {
      cancelled = true;
    };
    // `status` is intentionally omitted from deps: we only want this to run
    // once on mount. The guard `if (status !== "checking") return;` covers
    // the case where it was already resolved by the lazy initializer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDone = useCallback(() => {
    markOnboardingDone();
    setOpen(false);
  }, []);

  const handleSkip = useCallback(() => {
    markOnboardingDone();
    setOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  }, []);

  const handleCurrencyNext = useCallback((currency: CurrencyCode) => {
    saveCurrencyCookie(currency);
    setStep(3);
  }, []);

  const handleAccountAdded = useCallback(() => {
    setStep(4);
  }, []);

  // Lock body scroll while the wizard is visible
  useEffect(() => {
    if (!shouldRender) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [shouldRender]);

  // Close on Escape — only during active (non-exiting) display
  useEffect(() => {
    if (!shouldRender || isExiting || step === 1) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleSkip();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [shouldRender, isExiting, step, handleSkip]);

  // Nothing to show — status is checking or hidden, or animation finished
  if (status !== "show" && status !== "checking") return null;
  if (!shouldRender) return null;

  const dataExiting = isExiting ? "true" : "false";

  return (
    // Full-screen semi-transparent backdrop
    <div
      className="modal-overlay"
      data-exiting={dataExiting}
      style={{
        // Wizard uses z-50 to sit above dashboard content but below any
        // existing z-60 modals that might be open later.
        zIndex: 50,
        alignItems: "flex-start",
        paddingTop: 80,
        paddingBottom: 24,
      }}
      role="presentation"
    >
      {/* Wizard card */}
      <div
        className="modal-panel"
        data-exiting={dataExiting}
        role="dialog"
        aria-modal="true"
        aria-label={
          step === 1
            ? "Welcome to Assetly"
            : step === 2
              ? "Choose your currency"
              : step === 3
                ? "Add your first account"
                : "You're all set"
        }
        style={{
          maxWidth: 520,
          // Override default modal-panel padding to give step 2 (with form)
          // a bit more breathing room via consistent padding.
          padding: 32,
          // Allow the card to grow taller for step 2 which contains the form
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
        }}
        tabIndex={-1}
      >
        {/* Progress dots */}
        <div style={{ marginBottom: 28 }}>
          <ProgressDots step={step} />
        </div>

        {/* Step content */}
        {step === 1 && <StepWelcome onNext={handleNext} />}

        {step === 2 && <StepChooseCurrency onNext={handleCurrencyNext} />}

        {step === 3 && (
          <StepAddAccount
            onAccountAdded={handleAccountAdded}
            onSkip={handleSkip}
          />
        )}

        {step === 4 && <StepAllSet onDone={handleDone} />}

        {/* Skip setup — shown on steps 2 and 3 via the individual step
            components; step 1 shows "Get started" only so no skip here */}
      </div>
    </div>
  );
}
