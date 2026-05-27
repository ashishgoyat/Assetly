/**
 * Dashboard layout — Server Component
 * App shell: sidebar + topbar + page content.
 */

import Sidebar from "@/app/components/layout/Sidebar";
import Topbar from "@/app/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      {/* sidebar-desktop is hidden on mobile via CSS; tablet gets icon-only width */}
      <div className="sidebar-desktop">
        <Sidebar />
      </div>
      <div className="main">
        <Topbar />
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
