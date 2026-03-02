import { UserButton } from "@clerk/nextjs";
import SearchForm from "@/components/SearchForm";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-bold tracking-tight text-stone-900">
              Toronto Zoning
            </span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-[12px] text-stone-400 sm:block">
              By-law 569-2013 · 19 GIS layers
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-[24px] font-bold tracking-tight text-stone-900">
            Zoning Lookup
          </h1>
          <p className="mt-1 text-[13px] text-stone-500">
            Enter any Toronto address to generate a comprehensive zoning report
            — standards, overlays, development potential, and more.
          </p>
        </div>

        <SearchForm />
      </main>
    </div>
  );
}
