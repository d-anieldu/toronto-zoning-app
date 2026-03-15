"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Status = "pending" | "reviewing" | "accepted" | "rejected" | "duplicate";

interface FeedbackItem {
  id: string;
  address: string;
  field_path: string;
  field_label: string | null;
  tab_name: string | null;
  current_value: string | null;
  suggested_value: string | null;
  source_url: string | null;
  reason: string | null;
  status: Status;
  admin_notes: string | null;
  created_at: string;
  user_id: string | null;
}

const STATUS_COLORS: Record<Status, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  duplicate: "bg-stone-100 text-stone-500 border-stone-200",
};

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [correctedValue, setCorrectedValue] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchItems = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    let query = supabase
      .from("feedback_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query.limit(100);
    setItems(data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    // Check admin role
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setIsAdmin(data?.role === "admin" || data?.role === "reviewer");
    });
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function updateStatus(id: string, newStatus: Status) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updates: any = {
      status: newStatus,
      admin_notes: adminNotes || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await supabase.from("feedback_reports").update(updates).eq("id", id);

    // If accepted, write to corrections_log
    if (newStatus === "accepted") {
      const item = items.find((i) => i.id === id);
      if (item) {
        await supabase.from("corrections_log").insert({
          feedback_id: id,
          address: item.address,
          field_path: item.field_path,
          field_label: item.field_label,
          old_value: item.current_value,
          new_value: correctedValue || item.suggested_value,
          corrected_by: user?.id,
        });
      }
    }

    setAdminNotes("");
    setCorrectedValue("");
    setExpanded(null);
    fetchItems();
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <p className="text-[14px] text-stone-500">
            Checking admin access…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-[15px] font-bold tracking-tight text-stone-900"
            >
              Toronto Zoning
            </Link>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Admin
            </span>
          </div>
          <Link
            href="/dashboard"
            className="text-[12px] text-stone-500 hover:text-stone-900"
          >
            ← Back to lookup
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-stone-900">
              Feedback Queue
            </h1>
            <p className="text-[13px] text-stone-500">
              Review user-reported data issues
            </p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-[12px] font-medium text-stone-600">
            {items.length} items
          </span>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 mb-6 rounded-lg bg-stone-100 p-1 w-fit">
          {(["all", "pending", "reviewing", "accepted", "rejected", "duplicate"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                  filter === s
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>

        {loading ? (
          <p className="text-[13px] text-stone-400">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
            <p className="text-[14px] text-stone-400">
              No {filter === "all" ? "" : filter} feedback items
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-stone-200 bg-white shadow-sm"
              >
                <button
                  onClick={() =>
                    setExpanded(expanded === item.id ? null : item.id)
                  }
                  className="w-full px-5 py-4 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-stone-900">
                        {item.address}
                      </p>
                      <p className="mt-0.5 text-[11px] text-stone-500">
                        {item.field_label || item.field_path}
                        {item.tab_name && (
                          <span className="ml-2 text-stone-400">
                            · {item.tab_name}
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        STATUS_COLORS[item.status]
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Quick preview */}
                  <div className="mt-2 flex gap-4 text-[11px]">
                    {item.current_value && (
                      <span className="text-stone-400">
                        Shows:{" "}
                        <span className="text-stone-600">
                          {item.current_value}
                        </span>
                      </span>
                    )}
                    {item.suggested_value && (
                      <span className="text-stone-400">
                        Suggested:{" "}
                        <span className="text-emerald-600 font-medium">
                          {item.suggested_value}
                        </span>
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === item.id && (
                  <div className="border-t border-stone-100 px-5 py-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 text-[12px]">
                      <div>
                        <span className="text-stone-400">Field path:</span>
                        <p className="font-mono text-stone-600">
                          {item.field_path}
                        </p>
                      </div>
                      <div>
                        <span className="text-stone-400">Reported:</span>
                        <p className="text-stone-600">
                          {new Date(item.created_at).toLocaleString("en-CA")}
                        </p>
                      </div>
                      {item.reason && (
                        <div className="sm:col-span-2">
                          <span className="text-stone-400">Reason:</span>
                          <p className="text-stone-700 mt-1">{item.reason}</p>
                        </div>
                      )}
                      {item.source_url && (
                        <div className="sm:col-span-2">
                          <span className="text-stone-400">Source:</span>
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-600 underline truncate mt-1"
                          >
                            {item.source_url}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Action form */}
                    {(item.status === "pending" ||
                      item.status === "reviewing") && (
                      <div className="border-t border-stone-100 pt-4 space-y-3">
                        {item.status === "pending" && (
                          <label className="block">
                            <span className="text-[11px] font-medium text-stone-500">
                              Corrected value (for accept)
                            </span>
                            <input
                              type="text"
                              value={correctedValue}
                              onChange={(e) =>
                                setCorrectedValue(e.target.value)
                              }
                              placeholder={
                                item.suggested_value || "Enter corrected value"
                              }
                              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-[12px] outline-none focus:border-stone-400"
                            />
                          </label>
                        )}

                        <label className="block">
                          <span className="text-[11px] font-medium text-stone-500">
                            Admin notes
                          </span>
                          <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            rows={2}
                            placeholder="Internal notes…"
                            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-[12px] outline-none focus:border-stone-400 resize-none"
                          />
                        </label>

                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(item.id, "accepted")}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateStatus(item.id, "rejected")}
                            className="rounded-lg bg-red-600 px-4 py-2 text-[11px] font-semibold text-white hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => updateStatus(item.id, "duplicate")}
                            className="rounded-lg border border-stone-200 px-4 py-2 text-[11px] font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                          >
                            Duplicate
                          </button>
                          {item.status === "pending" && (
                            <button
                              onClick={() =>
                                updateStatus(item.id, "reviewing")
                              }
                              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              Mark reviewing
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {item.admin_notes && (
                      <div className="text-[11px] text-stone-400">
                        <span className="font-medium">Admin notes:</span>{" "}
                        {item.admin_notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
