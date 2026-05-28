import Link from "next/link";

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

// ── Steps data ────────────────────────────────────────────────────────────────

const steps = [
  {
    number: "1",
    title: "Sign up",
    description: "Create your free account in 30 seconds. No credit card required.",
  },
  {
    number: "2",
    title: "Connect your data",
    description: "Add accounts, set budgets, and create goals for what you care about.",
  },
  {
    number: "3",
    title: "Stay in control",
    description: "Check in daily, get personalised insights, and hit your targets.",
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
            <Link href="/login" className="btn">
              Log in
            </Link>
            <Link href="/signup" className="btn btn-accent">
              Get started free
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
              style={{ fontFamily: "var(--f-display)" }}
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
              <Link href="/signup" className="btn btn-accent btn-lg">
                Get started free →
              </Link>
              <Link href="/login" className="btn btn-lg">
                Log in
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
              style={{ fontFamily: "var(--f-display)" }}
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

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section
          aria-labelledby="how-heading"
          className="border-y border-[var(--border)] bg-[var(--surface-2)] px-6 py-20 md:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              id="how-heading"
              className="mb-12 text-center text-[clamp(1.4rem,2.8vw,1.75rem)] leading-tight tracking-[-0.01em] text-[var(--ink)] md:mb-16"
              style={{ fontFamily: "var(--f-display)" }}
            >
              Up and running in minutes
            </h2>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
              {steps.map(({ number, title, description }) => (
                <div key={number} className="flex flex-col items-center text-center md:items-start md:text-left">
                  <span
                    className="mb-3 leading-none text-[3rem] font-normal text-[var(--accent)]"
                    style={{ fontFamily: "var(--f-display)" }}
                    aria-hidden="true"
                  >
                    {number}
                  </span>
                  <h3
                    className="mb-2 text-base font-semibold text-[var(--ink)]"
                    style={{ fontFamily: "var(--f-sans)" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-[13px] leading-relaxed text-[var(--ink-3)]"
                    style={{ fontFamily: "var(--f-sans)" }}
                  >
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA banner ────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="cta-heading"
          className="border-y border-[var(--accent-soft)] bg-[var(--accent-tint)] px-6 py-20 text-center md:py-24"
        >
          <div className="mx-auto max-w-xl">
            <h2
              id="cta-heading"
              className="mb-6 text-[clamp(1.5rem,3vw,2rem)] leading-tight tracking-[-0.01em] text-[var(--ink)]"
              style={{ fontFamily: "var(--f-display)" }}
            >
              Ready to take control of your finances?
            </h2>
            <Link href="/signup" className="btn btn-accent btn-lg">
              Create your free account →
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg)] px-6 pb-8 pt-12">
        <div className="mx-auto max-w-6xl">
          {/* Two-column grid */}
          <div className="mb-10 grid grid-cols-1 gap-10 sm:grid-cols-2">
            {/* Brand column */}
            <div>
              <Link
                href="/"
                className="mb-3 flex items-center gap-2 no-underline"
                aria-label="Assetly home"
              >
                <span className="brand-mark" aria-hidden="true">
                  A
                </span>
                <span
                  className="text-base font-semibold tracking-tight text-[var(--ink)]"
                  style={{ fontFamily: "var(--f-sans)" }}
                >
                  Assetly
                </span>
              </Link>
              <p
                className="max-w-[220px] text-[13px] leading-relaxed text-[var(--ink-3)]"
                style={{ fontFamily: "var(--f-sans)" }}
              >
                Personal finance, simplified.
              </p>
            </div>

            {/* Link groups */}
            <div className="grid grid-cols-2 gap-8">
              {/* Product */}
              <div>
                <p
                  className="sec-label mb-4"
                  style={{ fontFamily: "var(--f-sans)" }}
                >
                  Product
                </p>
                <ul className="space-y-2.5">
                  {["Dashboard", "Budgets", "Goals", "Bills"].map((item) => (
                    <li key={item}>
                      <Link
                        href="/login"
                        className="text-[13px] text-[var(--ink-3)] no-underline transition-colors hover:text-[var(--ink)]"
                        style={{ fontFamily: "var(--f-sans)" }}
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <p
                  className="sec-label mb-4"
                  style={{ fontFamily: "var(--f-sans)" }}
                >
                  Company
                </p>
                <ul className="space-y-2.5">
                  <li>
                    <Link
                      href="/signup"
                      className="text-[13px] text-[var(--ink-3)] no-underline transition-colors hover:text-[var(--ink)]"
                      style={{ fontFamily: "var(--f-sans)" }}
                    >
                      Sign up
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-[var(--border)] pt-6 text-center">
            <p
              className="text-[12px] text-[var(--ink-4)]"
              style={{ fontFamily: "var(--f-sans)" }}
            >
              &copy; 2026 Assetly
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
