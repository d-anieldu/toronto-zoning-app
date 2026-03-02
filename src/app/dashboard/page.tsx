import { UserButton } from "@clerk/nextjs";
import SearchForm from "@/components/SearchForm";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-[15px] font-semibold tracking-tight text-stone-900">
            Toronto Zoning
          </span>
          <UserButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold tracking-tight text-stone-900">
            Zoning Lookup
          </h1>
          <p className="mt-1 text-[13px] text-stone-400">
            Enter a Toronto address to generate a full zoning report.
          </p>
        </div>

        <SearchForm />
      </main>
    </div>
  );
}
