import Link from "next/link";
import {
  ArrowRight,
  Layers,
  FileText,
  Building2,
  BookOpen,
  Search,
  Zap,
  BarChart3,
  Ruler,
  TrendingUp,
  AlertTriangle,
  Car,
  FileCheck,
  DollarSign,
  Microscope,
} from "lucide-react";
import UserNav from "@/components/UserNav";

export default async function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <span className="font-heading text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
            Toronto Zoning
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="rounded-full bg-[var(--text-primary)] px-4 py-1.5 text-[13px] font-medium text-white hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-36 pb-20">
        {/* Hero — split layout with mock report preview */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[12px] font-medium text-emerald-700">Free during beta</span>
            </div>
            <h1 className="font-heading mt-6 text-[clamp(2.5rem,5vw,3.75rem)] leading-[1.05] font-bold tracking-tight text-[var(--text-primary)]">
              Know what you can
              <br />
              <span className="bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
                build — before you buy
              </span>
            </h1>
            <p className="mt-6 text-[17px] leading-relaxed text-[var(--text-secondary)]">
              The complete zoning profile for any Toronto address. Height, FSI,
              setbacks, overlays, exceptions, and development potential — resolved
              in seconds from 19 GIS layers.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-stone-900/20 hover:opacity-90 transition-all"
              >
                Start a lookup
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-[13px] text-[var(--text-muted)]">
                No credit card required
              </span>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex items-center gap-6 border-t border-[var(--border)] pt-6">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                Built for
              </p>
              <div className="flex flex-wrap gap-2">
                {["Developers", "Architects", "Planners", "Lawyers"].map((role) => (
                  <span key={role} className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Mock report preview */}
          <div className="relative">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl shadow-stone-200/50">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
                <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="ml-2 text-[11px] text-[var(--text-muted)]">Zoning Report</span>
              </div>

              <div className="mt-4">
                <p className="font-heading text-[18px] font-bold text-[var(--text-primary)]">226 Viewmount Ave</p>
                <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">43.656330°N, 79.431230°W</p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-lg bg-[var(--text-primary)] px-2.5 py-1 text-[11px] font-bold text-white">RD</span>
                <span className="rounded-lg border border-[var(--border)] bg-stone-50 px-2.5 py-1 font-mono text-[11px] text-[var(--text-secondary)]">
                  RD (f12.0; a325) (x123)
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Exception #123
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { v: "10", u: "m", l: "Max Height" },
                  { v: "0.6", u: "", l: "Max FSI" },
                  { v: "35", u: "%", l: "Coverage" },
                ].map((m) => (
                  <div key={m.l} className="rounded-lg border border-[var(--border)] bg-stone-50 p-3">
                    <p className="font-heading text-[18px] font-bold text-[var(--text-primary)]">
                      {m.v}<span className="text-[11px] font-normal text-[var(--text-muted)]">{m.u}</span>
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">{m.l}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-[var(--border)] bg-stone-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[10px] text-[var(--text-muted)]">FRONT</p>
                    <p className="font-mono text-[13px] font-semibold text-[var(--text-primary)]">6.0m</p>
                  </div>
                  <div className="relative mx-4 flex-1">
                    <div className="aspect-[4/3] rounded-md border-2 border-dashed border-stone-300 bg-[var(--card)]">
                      <div className="absolute inset-3 rounded bg-emerald-100 border border-emerald-300 flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-emerald-700">195 m² buildable</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-[var(--text-muted)]">REAR</p>
                    <p className="font-mono text-[13px] font-semibold text-[var(--text-primary)]">7.5m</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating accent cards */}
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
              <p className="text-[11px] font-semibold text-amber-800">Heritage Listed</p>
              <p className="text-[10px] text-amber-600">Part IV OHA — flagged</p>
            </div>
            <div className="absolute -top-4 -right-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 shadow-lg">
              <p className="text-[11px] font-semibold text-sky-800">MTSA Active</p>
              <p className="text-[10px] text-sky-600">Bloor-Yonge Station</p>
            </div>
          </div>
        </div>

        {/* Data strip */}
        <div className="mt-28 border-t border-[var(--border)] pt-10">
          <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
            {[
              { num: "19", label: "GIS layers queried", Icon: Layers },
              { num: "6,063", label: "Parsed exceptions", Icon: FileText },
              { num: "25", label: "Zone families", Icon: Building2 },
              { num: "96", label: "By-law chapters parsed", Icon: BookOpen },
            ].map((stat) => (
              <div key={stat.label} className="flex items-start gap-3">
                <stat.Icon className="mt-1.5 h-5 w-5 text-[var(--text-muted)]" />
                <div>
                  <p className="font-heading text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">
                    {stat.num}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--text-muted)]">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-28 border-t border-[var(--border)] pt-10">
          <p className="text-[13px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
            How it works
          </p>
          <h2 className="font-heading mt-3 text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
            From address to actionable report in seconds
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Enter an address",
                desc: "Type any Toronto address. Autocomplete matches against the City\u2019s address database with fuzzy matching.",
                Icon: Search,
              },
              {
                step: "02",
                title: "We resolve everything",
                desc: "19 GIS layers, the full exception database, overlay maps, and current by-law text are cross-referenced in real time.",
                Icon: Zap,
              },
              {
                step: "03",
                title: "Get your zoning profile",
                desc: "Effective standards, development envelope, permitted uses, parking, heritage flags, and charges — all in one report.",
                Icon: BarChart3,
              },
            ].map((s) => (
              <div key={s.step} className="relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                <span className="absolute -top-3 left-5 rounded-full bg-[var(--text-primary)] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  {s.step}
                </span>
                <s.Icon className="h-7 w-7 text-[var(--text-muted)]" />
                <h3 className="font-heading mt-3 text-[15px] font-semibold text-[var(--text-primary)]">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What's in a report */}
        <div className="mt-28 border-t border-[var(--border)] pt-10">
          <p className="text-[13px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
            What&apos;s in a report
          </p>
          <h2 className="font-heading mt-3 text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
            Everything a planning consultant would research — automated
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: Ruler, title: "Effective Standards", desc: "Height, FSI, setbacks, and lot coverage — resolved from base zone, overlays, and exception overrides.", color: "border-[var(--border)]" },
              { Icon: TrendingUp, title: "Development Potential", desc: "Max GFA, buildable envelope, feasible building types, floor plate limits, and estimated storeys.", color: "border-emerald-200" },
              { Icon: AlertTriangle, title: "Constraints & Flags", desc: "Heritage designation, ravine protection, archaeological potential, and holding provisions flagged by severity.", color: "border-amber-200" },
              { Icon: Car, title: "Parking Requirements", desc: "Residential and visitor rates by building type, zone-specific exemptions, and exception overrides.", color: "border-[var(--border)]" },
              { Icon: FileCheck, title: "Official Plan Context", desc: "OP designation, secondary plan, MTSA status, and applicable Site & Area Specific Policies.", color: "border-sky-200" },
              { Icon: DollarSign, title: "Development Charges", desc: "Estimated DC breakdown by category based on current City of Toronto rates.", color: "border-[var(--border)]" },
            ].map(({ Icon, title, desc, color }) => (
              <div key={title} className={`rounded-xl border ${color} bg-[var(--card)] p-5 shadow-sm transition-shadow hover:shadow-md`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100">
                  <Icon className="h-5 w-5 text-[var(--text-secondary)]" />
                </div>
                <h3 className="font-heading mt-3 text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample zone string decode */}
        <div className="mt-28 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
              <Microscope className="h-4 w-4 text-[var(--text-secondary)]" />
            </div>
            <p className="font-heading text-[15px] font-semibold text-[var(--text-primary)]">
              Example — what we decode
            </p>
          </div>
          <div className="mt-4 rounded-xl bg-[var(--text-primary)] px-6 py-4">
            <p className="font-mono text-[18px] font-medium text-white tracking-wide">
              RD (f15.0; a550) (x5)
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Zone Category", value: "Residential Detached", detail: "RD", bg: "bg-stone-50" },
              { label: "Min Frontage", value: "15.0 metres", detail: "f15.0", bg: "bg-stone-50" },
              { label: "Min Lot Area", value: "550 m²", detail: "a550", bg: "bg-stone-50" },
              { label: "Exception Applied", value: "Exception #5", detail: "x5", bg: "bg-amber-50" },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg ${item.bg} border border-[var(--border)] p-3.5`}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{item.label}</p>
                <p className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">{item.value}</p>
                <p className="mt-0.5 font-mono text-[11px] text-[var(--text-muted)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Use cases */}
        <div className="mt-28 border-t border-[var(--border)] pt-10">
          <p className="text-[13px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
            Use cases
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                role: "Real Estate Developer",
                question: "Can I build a 6-storey mid-rise on this RE site?",
                answer: "Get instant height, FSI, and setback data — plus the buildable envelope and GFA estimate.",
              },
              {
                role: "Architect",
                question: "What are the angular plane and stepback rules here?",
                answer: "See exactly which setback standards apply, including overlay and exception overrides.",
              },
              {
                role: "Planning Lawyer",
                question: "Does exception #2048 override the height on this site?",
                answer: "We parse all 6,063 exceptions with annotated provisions and by-law PDF links.",
              },
            ].map((uc) => (
              <div key={uc.role} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{uc.role}</p>
                <p className="mt-2 text-[14px] font-semibold text-[var(--text-primary)] italic">&ldquo;{uc.question}&rdquo;</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{uc.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-28 rounded-2xl bg-[var(--text-primary)] px-8 py-12 text-center shadow-xl">
          <h2 className="font-heading text-[24px] font-bold text-white">
            Stop spending hours on manual zoning research
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-[var(--text-muted)]">
            Get the same data a planning consultant would compile — in seconds, not days.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--card)] px-8 py-3.5 text-[14px] font-semibold text-[var(--text-primary)] shadow-lg transition-all hover:bg-stone-50 hover:shadow-xl"
          >
            Start your first lookup
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
          <p className="text-[12px] text-[var(--text-muted)]">
            Data sourced from the City of Toronto Open Data Portal. Not legal advice.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-[var(--text-muted)]">By-law 569-2013</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
