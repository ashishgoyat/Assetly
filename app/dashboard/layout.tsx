/**
 * Dashboard layout — Async Server Component
 * Protects all /dashboard routes — redirects unauthenticated users to /login.
 * Fetches session + accounts in parallel and passes them down to Sidebar.
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccounts } from "@/lib/data/store";
import Sidebar from "@/app/components/layout/Sidebar";
import Topbar from "@/app/components/layout/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, accounts] = await Promise.all([auth(), getAccounts()]);

  if (!session?.user) redirect("/login");

  const userName = session.user.name ?? "You";
  const userInitials = userName
    .split(" ")
    .filter((w: string) => w.length > 0)
    .map((w: string) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="app">
      {/* sidebar-desktop is hidden on mobile via CSS; tablet gets icon-only width */}
      <div className="sidebar-desktop">
        <Sidebar
          userName={userName}
          userInitials={userInitials}
          accounts={accounts}
        />
      </div>
      <div className="main">
        <Topbar
          userName={userName}
          userInitials={userInitials}
          accounts={accounts}
        />
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
