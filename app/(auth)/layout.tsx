/**
 * Auth layout — Server Component
 * Full-screen centered layout for login and signup pages.
 * No sidebar, no dashboard chrome — clean auth experience.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[var(--bg)]">
      {/* Wordmark */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl text-white"
          style={{ background: "var(--ink)", fontFamily: "var(--f-display)" }}
          aria-hidden="true"
        >
          A
        </div>
        <span
          className="text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--f-sans)", color: "var(--ink)" }}
        >
          Assetly
        </span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
