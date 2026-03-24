import Link from "next/link";
import { Ruler, TrendingUp, AlertTriangle, ArrowRight, Mail } from "lucide-react";
import SearchForm from "@/components/SearchForm";
import UserNav from "@/components/UserNav";
import RecentReports from "@/components/RecentReports";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Top navigation ── */}
      <header className="sticky top-0 z-50 w-full bg-stone-50/80 backdrop-blur-md shadow-sm">
        <nav className="flex items-center justify-between px-8 h-16 max-w-screen-2xl mx-auto">
          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight text-stone-900 font-heading"
          >
            Toronto Zoning
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium font-heading tracking-wide">
            {[
              { label: "Dashboard", href: "/dashboard", active: true },
              { label: "Reports", href: "/reports", active: false },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={
                  item.active
                    ? "text-stone-900 font-bold border-b-2 border-emerald-600 pb-1"
                    : "text-stone-500 hover:text-stone-900 transition-colors"
                }
              >
                {item.label}
              </Link>
            ))}
          </div>

          <UserNav />
        </nav>
        <div className="bg-stone-200/50 h-px" />
      </header>

      {/* ── Main content ── */}
      <main className="max-w-screen-2xl mx-auto px-8 py-12 space-y-20">
        {/* Search hero */}
        <section className="space-y-8">
          <div className="max-w-4xl mx-auto text-center space-y-2">
            <span className="text-xs tracking-widest uppercase text-stone-500 font-bold">
              Zoning Lookup
            </span>
            <h1 className="font-heading text-5xl font-extrabold tracking-tight text-stone-900">
              Precision Urban Planning
            </h1>
          </div>
          <SearchForm />
        </section>

        {/* Feature tip cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              Icon: Ruler,
              title: "Standards & Setbacks",
              desc: "Instantly verify permissible heights, floor space indexes (FSI), and required side-yard clearances for any lot.",
            },
            {
              Icon: TrendingUp,
              title: "Development Potential",
              desc: "Maximize Gross Floor Area (GFA). Our engine calculates theoretical maximums based on current by-laws.",
            },
            {
              Icon: AlertTriangle,
              title: "Constraints Flagged",
              desc: "Automated alerts for Heritage designations, TRCA hazards, and secondary plan site-specific policies.",
            },
          ].map((tip) => (
            <div
              key={tip.title}
              className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center mb-6">
                <tip.Icon className="h-5 w-5 text-stone-900" />
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">{tip.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </section>

        {/* Recent lookups */}
        <RecentReports />

        {/* CTA / feedback section */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center pt-8">
          <div className="lg:col-span-3 space-y-6">
            <h2 className="font-heading text-3xl font-bold text-stone-900">
              We&rsquo;re still Building, and Would Love Your Input
            </h2>
            <p className="text-stone-500 text-lg leading-relaxed">
              Toronto Zoning is actively under development. We&rsquo;re working hard to make
              zoning information more accessible, useful, and easy to navigate for homeowners,
              developers, planners, and anyone trying to make sense of the city&rsquo;s land use
              rules. If you have thoughts on what we should build, what&rsquo;s missing, or what
              would make your work easier, we&rsquo;d genuinely love to hear from you.
            </p>
            <div className="pt-4 flex flex-wrap gap-3">
              <a
                href="https://www.linkedin.com/in/danieljzdu/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-stone-900 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-stone-800 transition-all inline-flex items-center gap-2"
              >
                Connect with me on LinkedIn
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="mailto:d4du@uwaterloo.ca"
                className="border border-stone-300 text-stone-600 px-6 py-3 rounded-xl font-semibold shadow-sm hover:bg-stone-50 transition-all inline-flex items-center gap-2"
              >
                Email me
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2 aspect-square bg-stone-200 rounded-3xl overflow-hidden relative shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 text-white">
              <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
                Live Zone Status
              </div>
              <div className="text-lg font-bold">Downtown Core Expansion</div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-12 px-8 bg-stone-100 border-t border-stone-200 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-screen-2xl mx-auto gap-4">
          <div className="text-xs tracking-widest uppercase text-stone-500">
            © 2025 Toronto Zoning. All rights reserved.
          </div>
          <div className="flex gap-8 text-xs tracking-widest uppercase">
            <a href="#" className="text-stone-500 hover:text-stone-900 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-stone-500 hover:text-stone-900 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-stone-500 hover:text-stone-900 transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
