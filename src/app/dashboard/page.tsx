import { UserButton } from "@clerk/nextjs";
import SearchForm from "@/components/SearchForm";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              TZ
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Toronto Zoning
            </span>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Zoning Lookup</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter a Toronto address to get the full zoning report.
          </p>
        </div>

        <SearchForm />
      </main>
    </div>
  );
}
