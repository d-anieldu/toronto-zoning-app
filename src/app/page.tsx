import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-stone-50/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <span className="text-[15px] font-semibold tracking-tight text-stone-900">
            Toronto Zoning
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="/sign-in"
              className="text-[13px] text-stone-500 hover:text-stone-900"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-stone-900 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-stone-800"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-32 pb-20">
        {/* Hero */}
        <div className="max-w-3xl">
          <p className="text-[13px] font-medium uppercase tracking-widest text-stone-400">
            By-law 569-2013
          </p>
          <h1 className="mt-4 text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] font-bold tracking-tight text-stone-900">
            Zoning intelligence
            <br />
            for Toronto
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-stone-500">
            Enter any address. Get the complete zoning profile — effective
            standards, overlays, constraints, and development potential — resolved
            from 19 GIS layers and 6,063 site-specific exceptions.
          </p>
          <div className="mt-10 flex items-center gap-5">
            <Link
              href="/sign-up"
              className="rounded-full bg-stone-900 px-6 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800"
            >
              Start a lookup
            </Link>
            <span className="text-[13px] text-stone-400">
              Free during beta
            </span>
          </div>
        </div>

        {/* Data strip */}
        <div className="mt-24 border-t border-stone-200 pt-10">
          <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
            <div>
              <p className="text-[28px] font-semibold tracking-tight text-stone-900">
                19
              </p>
              <p className="mt-1 text-[13px] text-stone-400">GIS layers queried</p>
            </div>
            <div>
              <p className="text-[28px] font-semibold tracking-tight text-stone-900">
                6,063
              </p>
              <p className="mt-1 text-[13px] text-stone-400">
                Parsed exceptions
              </p>
            </div>
            <div>
              <p className="text-[28px] font-semibold tracking-tight text-stone-900">
                25
              </p>
              <p className="mt-1 text-[13px] text-stone-400">Zone families</p>
            </div>
            <div>
              <p className="text-[28px] font-semibold tracking-tight text-stone-900">
                96
              </p>
              <p className="mt-1 text-[13px] text-stone-400">
                By-law chapters parsed
              </p>
            </div>
          </div>
        </div>

        {/* What you get */}
        <div className="mt-24 border-t border-stone-200 pt-10">
          <p className="text-[13px] font-medium uppercase tracking-widest text-stone-400">
            What&apos;s in a report
          </p>
          <div className="mt-8 grid gap-x-12 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Effective Standards", "Height, FSI, setbacks, and lot coverage — resolved from base zone, overlays, and exception overrides."],
              ["Development Potential", "Max GFA, buildable envelope, feasible building types, floor plate limits, and estimated storeys."],
              ["Constraints", "Heritage designation, ravine protection, archaeological potential, and holding provisions flagged by severity."],
              ["Parking Requirements", "Residential and visitor rates by building type, zone-specific exemptions, and exception overrides."],
              ["Official Plan Context", "OP designation, secondary plan, MTSA status, and applicable Site & Area Specific Policies."],
              ["Development Charges", "Estimated DC breakdown by category based on current City of Toronto rates."],
            ].map(([title, desc]) => (
              <div key={title}>
                <h3 className="text-[15px] font-semibold text-stone-900">
                  {title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample zone string */}
        <div className="mt-24 rounded-2xl border border-stone-200 bg-white p-8">
          <p className="text-[13px] text-stone-400">
            Example — what we resolve
          </p>
          <p className="mt-3 font-mono text-[15px] text-stone-700">
            RD (f15.0; a550) (x5)
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-[12px] text-stone-600">
              Zone: Residential Detached
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-[12px] text-stone-600">
              Min frontage: 15.0m
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-[12px] text-stone-600">
              Min lot area: 550 m²
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[12px] text-amber-700">
              Exception #5 applied
            </span>
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-[12px] text-stone-400">
            Data sourced from the City of Toronto Open Data Portal. Not legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
