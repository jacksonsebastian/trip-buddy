"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  MapPin,
  LayoutDashboard,
  Map,
  LogOut,
  LogIn,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { getInitials } from "@/lib/utils";

const navItems = [
  { href: "/trips", label: "My Trips", icon: Map },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  if (status === "loading") {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border/50 glass-strong px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">Trip Buddy</span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5"
          >
            <LogIn className="h-4 w-4" />
            Log In
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
        <div className="flex flex-1 flex-col glass-strong border-r border-border/50">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 px-6 border-b border-border/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">Trip Buddy</span>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="border-t border-border/50 p-3">
            {session?.user ? (
              <div className="flex items-center gap-3 rounded-xl px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {session.user.name ? getInitials(session.user.name) : <User className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{session.user.name || "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-3 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
              >
                <LogIn className="h-4 w-4" />
                Log In
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed inset-x-0 top-0 z-50 md:hidden">
        <div className="glass-strong flex h-14 items-center justify-between border-b border-border/50 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold gradient-text">Trip Buddy</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 top-14 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed right-0 top-14 z-50 w-64 glass-strong border-l border-border/50 h-[calc(100vh-3.5rem)] p-3">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 border-t border-border/50 pt-4">
                {session?.user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {session.user.name ? getInitials(session.user.name) : <User className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{session.user.name || "User"}</p>
                        <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-3 py-2.5 text-sm font-semibold text-white shadow-lg"
                  >
                    <LogIn className="h-4 w-4" />
                    Log In
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden safe-bottom">
        <div className="glass-strong border-t border-border/50">
          <nav className="flex items-center justify-around py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 overflow-y-auto">
        <div className="pt-14 pb-24 md:pt-0 md:pb-0 min-h-full">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
