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
  report_id: string | null;
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
  const [addressFilter, setAddressFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<Status | null>(null);

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
    if (addressFilter.trim()) {
      query = query.ilike("address", `%${addressFilter.trim()}%`);
    }
    if (dateFrom) {
      query = query.gte("created_at", `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59`);
    }

    const { data } = await query.limit(100);
    setItems(data ?? []);
    setLoading(false);
  }, [filter, addressFilter, dateFrom, dateTo]);

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

  async function bulkUpdateStatus(newStatus: Status) {
    if (selected.size === 0) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const updates: any = {
      status: newStatus,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("feedback_reports")
      .update(updates)
      .in("id", Array.from(selected));

    setSelected(new Set());
    setBulkConfirm(null);
    fetchItems();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
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
          <div className="flex items-center gap-4">
            <Link
              href="/admin/users"
              className="text-[12px] text-stone-500 hover:text-stone-900"
            >
              Users
            </Link>
            <Link
              href="/dashboard"
              className="text-[12px] text-stone-500 hover:text-stone-900"
            >
              ← Back to lookup
            </Link>
          </div>
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
        <div className="flex gap-1 mb-4 rounded-lg bg-stone-100 p-1 w-fit">
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

        {/* Address + date range filters */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <label className="block">
            <span className="text-[11px] font-medium text-stone-500">Address</span>
            <input
              type="text"
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
              placeholder="Filter by address…"
              className="mt-1 block w-56 rounded-lg border border-stone-200 px-3 py-1.5 text-[12px] outline-none focus:border-stone-400"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-stone-500">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 block rounded-lg border border-stone-200 px-3 py-1.5 text-[12px] outline-none focus:border-stone-400"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-stone-500">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 block rounded-lg border border-stone-200 px-3 py-1.5 text-[12px] outline-none focus:border-stone-400"
            />
          </label>
          {(addressFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setAddressFilter(""); setDateFrom(""); setDateTo(""); }}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5">
            <span className="text-[12px] font-medium text-sky-800">
              {selected.size} selected
            </span>
            <button
              onClick={() => setBulkConfirm("accepted")}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Accept Selected
            </button>
            <button
              onClick={() => setBulkConfirm("rejected")}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Reject Selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto text-[11px] text-stone-500 hover:text-stone-700"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Bulk confirm dialog */}
        {bulkConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xl max-w-sm w-full mx-4">
              <h3 className="text-[15px] font-bold text-stone-900">
                {bulkConfirm === "accepted" ? "Accept" : "Reject"} {selected.size} items?
              </h3>
              <p className="mt-2 text-[12px] text-stone-500">
                This will update the status of {selected.size} feedback item{selected.size > 1 ? "s" : ""} to <span className="font-semibold">{bulkConfirm}</span>. This action cannot be undone.
              </p>
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  onClick={() => setBulkConfirm(null)}
                  className="rounded-lg border border-stone-200 px-4 py-2 text-[11px] font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => bulkUpdateStatus(bulkConfirm)}
                  className={`rounded-lg px-4 py-2 text-[11px] font-semibold text-white transition-colors ${
                    bulkConfirm === "accepted"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Confirm {bulkConfirm === "accepted" ? "Accept" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

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
            {/* Select all header */}
            <div className="flex items-center gap-3 px-5 py-2">
              <input
                type="checkbox"
                checked={selected.size === items.length && items.length > 0}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 rounded border-stone-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-[11px] text-stone-400">
                {selected.size === items.length && items.length > 0 ? "Deselect all" : "Select all"}
              </span>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border bg-white shadow-sm ${
                  selected.has(item.id) ? "border-sky-300 ring-1 ring-sky-100" : "border-stone-200"
                }`}
              >
                <div className="flex items-start">
                  <div className="flex items-center pl-4 pt-4">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="h-3.5 w-3.5 rounded border-stone-300 text-sky-600 focus:ring-sky-500"
                    />
                  </div>
                <button
                  onClick={() =>
                    setExpanded(expanded === item.id ? null : item.id)
                  }
                  className="w-full px-4 py-4 text-left"
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
                    {item.report_id && (
                      <Link
                        href={`/reports/${item.report_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sky-600 hover:text-sky-700 font-medium"
                      >
                        View Report →
                      </Link>
                    )}
                  </div>
                </button>
                </div>

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
