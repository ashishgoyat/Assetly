"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return localStorage.getItem("sidebar-collapsed") === "true";
}

function getServerSnapshot() {
  return false;
}

function setSidebarCollapsed(next: boolean) {
  localStorage.setItem("sidebar-collapsed", String(next));
  listeners.forEach((cb) => cb());
}

interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    setSidebarCollapsed(!collapsed);
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <div className="app" data-sidebar-collapsed={collapsed}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
