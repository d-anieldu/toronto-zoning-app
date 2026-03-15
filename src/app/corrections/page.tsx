import { createServerSupabase } from "@/lib/supabase-server";
import Link from "next/link";
import UserNav from "@/components/UserNav";

export default async function CorrectionsPage() {
  const supabase = await createServerSupabase();
  const { data: corrections } = await supabase
    .from("corrections_log")
    .select("*")
    .order("corrected_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link
            href="/dashboard"
            className="text-[15px] font-bold tracking-tight text-stone-900"
          >
            Toronto Zoning
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-[12px] text-stone-500 hover:text-stone-900"
            >
              ← Back to lookup
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-[22px] font-bold tracking-tight text-stone-900">
          Correction Log
        </h1>
        <p className="mt-1 text-[13px] text-stone-500">
          Verified corrections applied to our zoning data. We review every report
          — your feedback makes this tool more accurate.
        </p>

        <div className="mt-8 space-y-3">
          {corrections && corrections.length > 0 ? (
            corrections.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="text-[13px] font-semibold text-stone-900">
                  {c.address}
                </div>
                <div className="mt-0.5 text-[11px] text-stone-400">
                  {c.field_label || c.field_path}
                </div>
                <div className="mt-2 text-[12px]">
                  <span className="line-through text-red-400">{c.old_value}</span>
                  {" → "}
                  <span className="font-medium text-emerald-600">
                    {c.new_value}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-stone-400">
                  {new Date(c.corrected_at).toLocaleDateString("en-CA")}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
              <p className="text-[14px] text-stone-400">
                No corrections yet — all data looking good!
              </p>
              <p className="mt-1 text-[12px] text-stone-400">
                See something wrong in a report? Click the ⚑ flag icon next to
                any value.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
