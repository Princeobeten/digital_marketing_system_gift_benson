"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/campaigns", label: "Campaigns", icon: "📣" },
  { href: "/customers", label: "Customers", icon: "👥" },
  { href: "/segments", label: "Segments", icon: "🎯" },
  { href: "/products", label: "Products", icon: "📱" },
];

export function Sidebar({
  user,
  onNavigate,
}: {
  user: { name: string; email: string; role: string };
  /** Called when a nav item or sign-out is activated (used to close the mobile drawer). */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    onNavigate?.();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          GR
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">GadgetReach</p>
          <p className="text-[11px] text-slate-400">Marketing System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-slate-800">
            {user.name}
          </p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
          <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {user.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          ⏻ Sign out
        </button>
      </div>
    </aside>
  );
}
