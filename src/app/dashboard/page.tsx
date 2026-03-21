import Link from "next/link";
import { Ruler, TrendingUp, AlertTriangle } from "lucide-react";
import SearchForm from "@/components/SearchForm";
import UserNav from "@/components/UserNav";
import RecentReports from "@/components/RecentReports";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="font-heading text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
                Toronto Zoning
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Beta
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {[
                { label: "Dashboard", href: "/dashboard", active: true },
                { label: "Compare", href: "/compare", active: false },
                { label: "Reports", href: "/reports", active: false },
                { label: "Projects", href: "/projects", active: false },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    item.active
                      ? "bg-stone-100 text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-[12px] text-[var(--text-muted)] lg:block">
              By-law 569-2013 · 19 GIS layers
            </span>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Search hero — centrepiece */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
            Zoning Lookup
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-[14px] text-[var(--text-secondary)]">
            Enter any Toronto address to generate a comprehensive zoning report
            — standards, overlays, development potential, and more.
          </p>
        </div>

        <SearchForm />

        {/* Tip cards */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            {
              Icon: Ruler,
              title: "Standards & Setbacks",
              desc: "Height, FSI, lot coverage, and setbacks resolved from zone + overlays + exceptions.",
            },
            {
              Icon: TrendingUp,
              title: "Development Potential",
              desc: "Max GFA, buildable envelope, floor plate, and feasible building types.",
            },
            {
              Icon: AlertTriangle,
              title: "Constraints Flagged",
              desc: "Heritage, ravine protection, MTSA, holding provisions — graded by severity.",
            },
          ].map((tip) => (
            <div
              key={tip.title}
              className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-sm"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100">
                <tip.Icon className="h-4 w-4 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-primary)]">{tip.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <RecentReports />
      </main>
    </div>
  );
}
