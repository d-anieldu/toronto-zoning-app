import Link from "next/link";
import SearchForm from "@/components/SearchForm";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="text-[15px] font-bold tracking-tight text-stone-900">
                Toronto Zoning
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                Beta
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 shadow-sm hover:bg-stone-50 transition-colors"
            >
              📁 Projects
            </Link>
            <Link
              href="/compare"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 shadow-sm hover:bg-stone-50 transition-colors"
            >
              ⚖️ Compare
            </Link>
            <Link
              href="/intelligence"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 shadow-sm hover:bg-stone-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
              </svg>
              Intelligence
            </Link>
            <span className="hidden text-[12px] text-stone-400 lg:block">
              By-law 569-2013 · 19 GIS layers
            </span>
            {/* TODO: Re-add <UserButton /> when auth is re-enabled */}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Welcome section with contextual tips */}
        <div className="mb-8">
          <h1 className="text-[24px] font-bold tracking-tight text-stone-900">
            Zoning Lookup
          </h1>
          <p className="mt-1 text-[13px] text-stone-500">
            Enter any Toronto address to generate a comprehensive zoning report
            — standards, overlays, development potential, and more.
          </p>

          {/* Contextual quick-start tips — helps first-time users */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: "📐",
                title: "Standards & Setbacks",
                desc: "Height, FSI, lot coverage, and setbacks resolved from zone + overlays + exceptions.",
              },
              {
                icon: "🏗️",
                title: "Development Potential",
                desc: "Max GFA, buildable envelope, floor plate, and feasible building types.",
              },
              {
                icon: "⚠️",
                title: "Constraints Flagged",
                desc: "Heritage, ravine protection, MTSA, holding provisions — graded by severity.",
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
              >
                <span className="mt-0.5 text-[18px]">{tip.icon}</span>
                <div>
                  <p className="text-[12px] font-semibold text-stone-700">{tip.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-stone-400">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <SearchForm />
      </main>
    </div>
  );
}
