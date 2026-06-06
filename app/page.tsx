import Link from "next/link";
import DarkModeToggle from "@/app/components/ui/DarkModeToggle";

// ── Inline SVG icons (20×20) ─────────────────────────────────────────────────

function IconNetWorth() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="11" width="4" height="7" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="8" y="7" width="4" height="11" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="14" y="3" width="4" height="15" rx="1" fill="currentColor" />
    </svg>
  );
}

function IconBudgets() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2 A8 8 0 0 1 18 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
    </svg>
  );
}

function IconGoals() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3 L12.5 8.5 L18.5 9.3 L14.2 13.4 L15.3 19.3 L10 16.5 L4.7 19.3 L5.8 13.4 L1.5 9.3 L7.5 8.5 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconTransactions() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 6 L17 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 3 L17 6 L14 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 14 L3 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 11 L3 14 L6 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBills() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8 L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 11 L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="14" r="4" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 12 L14 14.5 L15.5 14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconInsights() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2 C6.13 2 3 5.13 3 9 C3 11.72 4.52 14.07 6.77 15.29 L6.77 17 C6.77 17.55 7.22 18 7.77 18 L12.23 18 C12.78 18 13.23 17.55 13.23 17 L13.23 15.29 C15.48 14.07 17 11.72 17 9 C17 5.13 13.87 2 10 2 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 18 L12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Feature data ─────────────────────────────────────────────────────────────

const features = [
  {
    Icon: IconNetWorth,
    name: "Net Worth",
    description: "Assets minus liabilities — your real financial picture at a glance.",
  },
  {
    Icon: IconBudgets,
    name: "Budgets",
    description: "Set monthly limits per category and track spend in real time.",
  },
  {
    Icon: IconGoals,
    name: "Goals",
    description: "Save toward anything. See your progress and ETA automatically.",
  },
  {
    Icon: IconTransactions,
    name: "Transactions",
    description: "Every income and expense, categorised and searchable.",
  },
  {
    Icon: IconBills,
    name: "Bills & Subscriptions",
    description: "Never miss a due date. Spot unused subscriptions instantly.",
  },
  {
    Icon: IconInsights,
    name: "Insights",
    description: "Personalised signals that surface what matters most to you.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md"
        style={{ backdropFilter: "blur(12px)" }}
      >
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3"
        >
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 no-underline"
            aria-label="Assetly home"
          >
            <span
              className="brand-mark"
              aria-hidden="true"
            >
              A
            </span>
            <span
              className="text-base font-semibold tracking-tight text-[var(--ink)]"
              style={{ fontFamily: "var(--f-sans)" }}
            >
              Assetly
            </span>
          </Link>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <Link href="/login" className="btn btn-accent">
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden px-6 pb-20 pt-20 md:pb-28 md:pt-28"
        >
          {/* Warm radial gradient backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 0%, var(--accent-tint) 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-2xl text-center">
            {/* Badge */}
            <div className="mb-6 flex justify-center">
              <span className="pill pill-accent text-xs">
                ✦ Personal finance, simplified
              </span>
            </div>

            {/* Headline */}
            <h1
              id="hero-heading"
              className="mb-5 text-[clamp(2.25rem,6vw,4rem)] leading-[1.05] tracking-[-0.02em] text-[var(--ink)]"
            >
              Your money, finally in one place.
            </h1>

            {/* Subheadline */}
            <p
              className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-[var(--ink-3)] md:text-lg"
              style={{ fontFamily: "var(--f-sans)" }}
            >
              Track assets, manage budgets, hit your goals — all in a dashboard
              built for clarity.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/login" className="btn btn-accent btn-lg">
                Get started free →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Feature grid ──────────────────────────────────────────────────── */}
        <section
          aria-labelledby="features-heading"
          className="px-6 pb-20 md:pb-28"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              id="features-heading"
              className="mb-10 text-center text-[clamp(1.5rem,3vw,2rem)] leading-tight tracking-[-0.01em] text-[var(--ink)] md:mb-12"
            >
              Everything you need to see the full picture
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ Icon, name, description }) => (
                <article
                  key={name}
                  className="card p-5"
                >
                  <div
                    className="mb-3 flex h-9 w-9 items-center justify-center rounded-[var(--r-sm)]"
                    style={{ background: "var(--accent-tint)", color: "var(--accent)" }}
                  >
                    <Icon />
                  </div>
                  <h3
                    className="mb-1 text-sm font-semibold text-[var(--ink)]"
                    style={{ fontFamily: "var(--f-sans)" }}
                  >
                    {name}
                  </h3>
                  <p
                    className="text-[13px] leading-snug text-[var(--ink-3)]"
                    style={{ fontFamily: "var(--f-sans)" }}
                  >
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg)] px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 no-underline"
            aria-label="Assetly home"
          >
            <span className="brand-mark" aria-hidden="true">A</span>
            <span className="text-sm font-semibold tracking-tight text-[var(--ink)]">
              Assetly
            </span>
          </Link>
          <p className="text-[12px] text-[var(--ink-4)]">&copy; 2026 Assetly</p>
        </div>
      </footer>
    </>
  );
}
