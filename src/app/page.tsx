import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  // If already signed in, go straight to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              TZ
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Toronto Zoning
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6">
        <div className="py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Zoning rules for any
            <br />
            <span className="text-blue-600">Toronto address</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
            Instantly look up height limits, setbacks, parking requirements,
            overlays, and development potential &mdash; powered by the City of
            Toronto&apos;s Zoning By-law 569-2013.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Start looking up addresses
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid gap-8 pb-24 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              19 GIS Layers
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Base zoning, height overlays, setbacks, parking zones, heritage
              registers, ravine protection, and more.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Development Potential
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Estimates max GFA, dwelling units, storeys, required parking, and
              development charges.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              6,063 Exceptions
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Site-specific exceptions from Chapter 900 are automatically
              applied to override base zone standards.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
