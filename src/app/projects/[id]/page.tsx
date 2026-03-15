"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import UserNav from "@/components/UserNav";
import FlagButton from "@/components/FlagButton";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ProjectProperty {
  id: string;
  address: string;
  lookup_data: any;
  notes: string;
  added_at: string;
}

interface FlagRecord {
  id: string;
  address: string;
  field_label: string;
  field_path: string;
  current_value: string;
  suggested_value: string | null;
  status: string;
  reason: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

type SortKey = "address" | "added_at" | "zone";
type ViewTab = "properties" | "flags" | "compare";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [properties, setProperties] = useState<ProjectProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab
  const [viewTab, setViewTab] = useState<ViewTab>("properties");

  // Add property
  const [newAddress, setNewAddress] = useState("");
  const [adding, setAdding] = useState(false);

  // Expanded rows
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("added_at");
  const [sortAsc, setSortAsc] = useState(false);

  // Inline note editing
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // Flags
  const [flagCounts, setFlagCounts] = useState<Record<string, number>>({});
  const [myFlags, setMyFlags] = useState<FlagRecord[]>([]);

  // Comparison
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [projRes, propsRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase
        .from("project_properties")
        .select("*")
        .eq("project_id", projectId)
        .order("added_at", { ascending: false }),
    ]);
    if (projRes.error) {
      setError("Project not found");
      setLoading(false);
      return;
    }
    setProject(projRes.data);
    const props: ProjectProperty[] = propsRes.data || [];
    setProperties(props);

    // Fetch flag counts per address
    if (props.length > 0) {
      const addresses = props.map((p) => p.address);
      const { data: flags } = await supabase
        .from("feedback_reports")
        .select("address, status")
        .in("address", addresses);

      if (flags) {
        const counts: Record<string, number> = {};
        flags.forEach((f: any) => {
          counts[f.address] = (counts[f.address] || 0) + 1;
        });
        setFlagCounts(counts);
      }

      // Fetch user's own flags for these addresses  
      if (user) {
        const { data: userFlags } = await supabase
          .from("feedback_reports")
          .select("id, address, field_label, field_path, current_value, suggested_value, status, reason, admin_notes, created_at, reviewed_at")
          .eq("user_id", user.id)
          .in("address", addresses)
          .order("created_at", { ascending: false });
        if (userFlags) setMyFlags(userFlags);
      }
    }

    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Sort properties
  const sorted = [...properties].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "address") cmp = a.address.localeCompare(b.address);
    else if (sortKey === "zone") {
      const zA = a.lookup_data?.zone_label || a.lookup_data?.zone || "";
      const zB = b.lookup_data?.zone_label || b.lookup_data?.zone || "";
      cmp = zA.localeCompare(zB);
    } else {
      cmp = new Date(a.added_at).getTime() - new Date(b.added_at).getTime();
    }
    return sortAsc ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Properties selected for comparison
  const compareProps = properties.filter((p) => selected.has(p.id));

  async function addProperty() {
    if (!newAddress.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const supabase = createClient();
      // First, run a lookup against the Railway backend
      const lookupRes = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: newAddress.trim() }),
      });

      let lookupData = {};
      if (lookupRes.ok) {
        lookupData = await lookupRes.json();
      } else {
        const err = await lookupRes.json().catch(() => ({}));
        setError(err.detail || "Lookup didn\u2019t return zoning data \u2014 the address will be added, but you can re-lookup later.");
      }

      const { error: insertErr } = await supabase.from("project_properties").insert({
        project_id: projectId,
        address: newAddress.trim(),
        lookup_data: lookupData,
      });

      if (insertErr) {
        if (insertErr.code === "23505") setError("This address is already in the project");
        else setError(insertErr.message);
      } else {
        setNewAddress("");
        fetchProject();
      }
    } catch {
      setError("Failed to add property");
    } finally {
      setAdding(false);
    }
  }

  async function removeProperty(propId: string) {
    if (!confirm("Remove this property from the project?")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("project_properties").delete().eq("id", propId);
    if (err) setError(err.message);
    else setProperties((prev) => prev.filter((p) => p.id !== propId));
  }

  async function saveNote(propId: string) {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("project_properties")
      .update({ notes: noteText })
      .eq("id", propId);
    if (err) setError(err.message);
    else {
      setProperties((prev) =>
        prev.map((p) => (p.id === propId ? { ...p, notes: noteText } : p))
      );
      setEditingNote(null);
    }
  }

  function exportCSV() {
    const headers = ["Address", "Zone", "Max Height", "Max Storeys", "Max FSI", "Front Setback", "Rear Setback", "Side Setback", "Lot Coverage", "Notes", "Added"];
    const rows = properties.map((p) => {
      const d = p.lookup_data || {};
      const env = d.building_envelope || {};
      return [
        p.address,
        d.zone_label || d.zone || d.zoning_category || "",
        env.height?.max_height || d.max_height || "",
        env.height?.storeys || d.max_storeys || "",
        env.density?.max_fsi || d.max_fsi || "",
        env.setbacks?.front?.min || d.front_setback || "",
        env.setbacks?.rear?.min || d.rear_setback || "",
        env.setbacks?.side?.min || d.side_setback || "",
        env.density?.max_lot_coverage || d.max_lot_coverage || "",
        (p.notes || "").replace(/"/g, '""'),
        new Date(p.added_at).toLocaleDateString(),
      ];
    });

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.name || "project"}_properties.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 gap-4">
        <p className="text-[15px] text-stone-600">Project not found</p>
        <Link href="/projects" className="text-[13px] text-blue-600 hover:underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[15px] font-bold tracking-tight text-stone-900">
              Toronto Zoning
            </Link>
            <span className="text-stone-300">/</span>
            <Link href="/projects" className="text-[14px] font-medium text-stone-500 hover:text-stone-700">
              Projects
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-[14px] font-medium text-stone-600">{project.name}</span>
          </div>
          <UserNav />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Project header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-stone-900">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-[13px] text-stone-500">{project.description}</p>
            )}
            <p className="mt-1 text-[11px] text-stone-400">
              {properties.length} {properties.length === 1 ? "property" : "properties"} · Created{" "}
              {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={exportCSV}
            disabled={properties.length === 0}
            className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-[12px] font-medium text-stone-600 shadow-sm hover:bg-stone-50 disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-xl bg-stone-100 p-1">
          {([
            { id: "properties" as ViewTab, label: "Properties", count: properties.length },
            { id: "flags" as ViewTab, label: "My Flags", count: myFlags.length },
            { id: "compare" as ViewTab, label: "Compare", count: selected.size },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setViewTab(t.id)}
              className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
                viewTab === t.id
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Add property bar — only on properties tab */}
        {viewTab === "properties" && (
          <div className="mb-6 flex gap-2">
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Add address — e.g. 446 Roselawn Ave"
              className="flex-1 rounded-lg border border-stone-200 px-4 py-2.5 text-[13px] focus:border-stone-400 focus:outline-none"
              onKeyDown={(e) => { if (e.key === "Enter") addProperty(); }}
            />
            <button
              onClick={addProperty}
              disabled={adding || !newAddress.trim()}
              className="rounded-lg bg-stone-900 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-40"
            >
              {adding ? "Looking up..." : "+ Add Property"}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-medium underline">Dismiss</button>
          </div>
        )}

        {/* ── Properties Tab ─── */}
        {viewTab === "properties" && (
          <>
            {properties.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
                <span className="text-[40px]">🏠</span>
                <p className="mt-3 text-[15px] font-medium text-stone-700">No properties yet</p>
                <p className="mt-1 text-[13px] text-stone-400">
                  Add an address above to look it up and add it to this project.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                {/* Table header */}
                <div className="grid grid-cols-[32px_1fr_120px_100px_80px_50px_60px] gap-3 border-b border-stone-100 bg-stone-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  <span />
                  <button onClick={() => toggleSort("address")} className="text-left hover:text-stone-700">
                    Address {sortKey === "address" && (sortAsc ? "↑" : "↓")}
                  </button>
                  <button onClick={() => toggleSort("zone")} className="text-left hover:text-stone-700">
                    Zone {sortKey === "zone" && (sortAsc ? "↑" : "↓")}
                  </button>
                  <button onClick={() => toggleSort("added_at")} className="text-left hover:text-stone-700">
                    Added {sortKey === "added_at" && (sortAsc ? "↑" : "↓")}
                  </button>
                  <span>Notes</span>
                  <span>Flags</span>
                  <span />
                </div>

                {/* Rows */}
                {sorted.map((prop) => {
                  const isExpanded = expanded.has(prop.id);
                  const isSelected = selected.has(prop.id);
                  const zoneLabel =
                    prop.lookup_data?.zone_label ||
                    prop.lookup_data?.zone ||
                    prop.lookup_data?.zoning_category ||
                    "—";
                  const hasData = prop.lookup_data && Object.keys(prop.lookup_data).length > 0;
                  const fc = flagCounts[prop.address] || 0;

                  return (
                    <div key={prop.id} className="border-b border-stone-100 last:border-b-0">
                      {/* Row */}
                      <div
                        className="grid cursor-pointer grid-cols-[32px_1fr_120px_100px_80px_50px_60px] gap-3 px-5 py-3 text-[13px] transition-colors hover:bg-stone-50"
                        onClick={() => toggleExpand(prop.id)}
                      >
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(prop.id)}
                            className="h-3.5 w-3.5 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-400">{isExpanded ? "▼" : "▶"}</span>
                          <span className="font-medium text-stone-900">{prop.address}</span>
                        </div>
                        <span className="text-stone-600">{zoneLabel}</span>
                        <span className="text-stone-500">
                          {new Date(prop.added_at).toLocaleDateString()}
                        </span>
                        <span className="truncate text-stone-400">
                          {prop.notes || "—"}
                        </span>
                        <span>
                          {fc > 0 && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              ⚑ {fc}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeProperty(prop.id); }}
                          className="text-right text-[11px] text-red-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-4">
                          {/* Quick actions */}
                          <div className="mb-4 flex items-center gap-3">
                            <Link
                              href={`/dashboard?address=${encodeURIComponent(prop.address)}`}
                              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-600 shadow-sm hover:bg-stone-50"
                            >
                              Open Full Report →
                            </Link>
                            <Link
                              href={`/compare?addresses=${encodeURIComponent(prop.address)}`}
                              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-600 shadow-sm hover:bg-stone-50"
                            >
                              Compare
                            </Link>
                          </div>

                          {/* Mini report with flag buttons */}
                          {hasData ? (
                            <MiniReport data={prop.lookup_data} address={prop.address} />
                          ) : (
                            <p className="text-[12px] text-stone-400">No zoning data available for this address.</p>
                          )}

                          {/* Notes */}
                          <div className="mt-4 border-t border-stone-200 pt-3">
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                              Notes
                            </div>
                            {editingNote === prop.id ? (
                              <div className="mt-2 flex gap-2">
                                <textarea
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-[13px] focus:border-stone-400 focus:outline-none"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => saveNote(prop.id)}
                                    className="rounded-lg bg-stone-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-stone-800"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingNote(null)}
                                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] text-stone-500 hover:bg-stone-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingNote(prop.id); setNoteText(prop.notes || ""); }}
                                className="mt-1 text-left text-[13px] text-stone-500 hover:text-stone-700"
                              >
                                {prop.notes || "Click to add notes..."}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Compare prompt */}
            {selected.size >= 2 && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-5 py-3">
                <p className="text-[13px] text-blue-700">
                  {selected.size} properties selected for comparison
                </p>
                <button
                  onClick={() => setViewTab("compare")}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-blue-700"
                >
                  Compare Selected →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── My Flags Tab ─── */}
        {viewTab === "flags" && (
          <div className="space-y-3">
            {myFlags.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
                <span className="text-[40px]">⚑</span>
                <p className="mt-3 text-[15px] font-medium text-stone-700">No flags submitted</p>
                <p className="mt-1 text-[13px] text-stone-400">
                  Expand a property and click ⚑ on any metric to report an issue.
                </p>
              </div>
            ) : (
              myFlags.map((flag) => (
                <div key={flag.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-stone-900">{flag.address}</span>
                        <StatusBadge status={flag.status} />
                      </div>
                      <p className="mt-1 text-[12px] text-stone-500">
                        <strong>{flag.field_label}</strong>: {flag.current_value}
                        {flag.suggested_value && <> → <span className="text-emerald-600">{flag.suggested_value}</span></>}
                      </p>
                      <p className="mt-1 text-[12px] text-stone-400">{flag.reason}</p>
                    </div>
                    <span className="text-[11px] text-stone-400">
                      {new Date(flag.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {flag.admin_notes && (
                    <div className="mt-3 rounded-lg bg-stone-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Admin Response</p>
                      <p className="mt-1 text-[12px] text-stone-700">{flag.admin_notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Compare Tab ─── */}
        {viewTab === "compare" && (
          <div>
            {compareProps.length < 2 ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
                <span className="text-[40px]">📊</span>
                <p className="mt-3 text-[15px] font-medium text-stone-700">Select properties to compare</p>
                <p className="mt-1 text-[13px] text-stone-400">
                  Go to the Properties tab and check 2-3 properties, then come back here.
                </p>
                <button
                  onClick={() => setViewTab("properties")}
                  className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800"
                >
                  ← Select Properties
                </button>
              </div>
            ) : (
              <CompareTable properties={compareProps} onRemove={(id) => toggleSelect(id)} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/** Inline mini-report showing key zoning metrics from lookup_data with flag buttons */
function MiniReport({ data, address }: { data: any; address: string }) {
  const fields = [
    { label: "Zone", path: "zone_label", value: data.zone_label || data.zone || data.zoning_category },
    { label: "Max Height", path: "building_envelope.height.max_height", value: data.building_envelope?.height?.max_height || data.max_height },
    { label: "Max Storeys", path: "building_envelope.height.storeys", value: data.building_envelope?.height?.storeys || data.max_storeys },
    { label: "Max FSI", path: "building_envelope.density.max_fsi", value: data.building_envelope?.density?.max_fsi || data.max_fsi },
    { label: "Front Setback", path: "building_envelope.setbacks.front.min", value: data.building_envelope?.setbacks?.front?.min || data.front_setback },
    { label: "Rear Setback", path: "building_envelope.setbacks.rear.min", value: data.building_envelope?.setbacks?.rear?.min || data.rear_setback },
    { label: "Side Setback", path: "building_envelope.setbacks.side.min", value: data.building_envelope?.setbacks?.side?.min || data.side_setback },
    { label: "Lot Coverage", path: "building_envelope.density.max_lot_coverage", value: data.building_envelope?.density?.max_lot_coverage || data.max_lot_coverage },
    { label: "Min Lot Area", path: "lot_requirements.min_lot_area", value: data.lot_requirements?.min_lot_area },
    { label: "Min Lot Frontage", path: "lot_requirements.min_lot_frontage", value: data.lot_requirements?.min_lot_frontage },
  ].filter((f) => f.value != null && f.value !== "" && f.value !== undefined);

  if (fields.length === 0) {
    return <p className="text-[12px] text-stone-400">No structured zoning data available.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
      {fields.map((f) => (
        <div key={f.label} className="group relative">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
            {f.label}
          </dt>
          <dd className="flex items-center gap-1 text-[13px] font-medium text-stone-800">
            {typeof f.value === "object" ? JSON.stringify(f.value) : String(f.value)}
            <FlagButton
              address={address}
              fieldPath={f.path}
              fieldLabel={f.label}
              currentValue={typeof f.value === "object" ? JSON.stringify(f.value) : String(f.value)}
              tabName="Project Mini Report"
            />
          </dd>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    reviewing: "bg-blue-100 text-blue-700",
    accepted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    duplicate: "bg-stone-100 text-stone-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

/** Side-by-side comparison table for selected properties */
function CompareTable({ properties, onRemove }: { properties: ProjectProperty[]; onRemove: (id: string) => void }) {
  const metricDefs = [
    { label: "Zone", get: (d: any) => d.zone_label || d.zone || d.zoning_category || "—" },
    { label: "Max Height", get: (d: any) => d.building_envelope?.height?.max_height || d.max_height || "—", numeric: true, higher: true },
    { label: "Max Storeys", get: (d: any) => d.building_envelope?.height?.storeys || d.max_storeys || "—", numeric: true, higher: true },
    { label: "Max FSI", get: (d: any) => d.building_envelope?.density?.max_fsi || d.max_fsi || "—", numeric: true, higher: true },
    { label: "Max GFA", get: (d: any) => d.building_envelope?.density?.max_gfa || d.max_gfa || "—", numeric: true, higher: true },
    { label: "Lot Coverage", get: (d: any) => d.building_envelope?.density?.max_lot_coverage || d.max_lot_coverage || "—", numeric: true, higher: true },
    { label: "Front Setback", get: (d: any) => d.building_envelope?.setbacks?.front?.min || d.front_setback || "—", numeric: true, higher: false },
    { label: "Rear Setback", get: (d: any) => d.building_envelope?.setbacks?.rear?.min || d.rear_setback || "—", numeric: true, higher: false },
    { label: "Side Setback", get: (d: any) => d.building_envelope?.setbacks?.side?.min || d.side_setback || "—", numeric: true, higher: false },
    { label: "Min Lot Area", get: (d: any) => d.lot_requirements?.min_lot_area || "—", numeric: true, higher: false },
    { label: "Min Lot Frontage", get: (d: any) => d.lot_requirements?.min_lot_frontage || "—", numeric: true, higher: false },
  ];

  function parseNum(v: any): number | null {
    if (v === "—" || v == null) return null;
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-stone-100 bg-stone-50">
            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              Metric
            </th>
            {properties.map((p) => (
              <th key={p.id} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-stone-700">
                <div className="flex items-center justify-between gap-2">
                  {p.address}
                  <button
                    onClick={() => onRemove(p.id)}
                    className="text-[10px] text-stone-400 hover:text-red-500"
                    title="Remove from comparison"
                  >
                    ×
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metricDefs.map((metric) => {
            const values = properties.map((p) => metric.get(p.lookup_data || {}));
            // Find best value: highest for height/FSI/coverage, lowest for setbacks/lot requirements
            let bestIdx = -1;
            if (metric.numeric) {
              let bestNum = metric.higher ? -Infinity : Infinity;
              values.forEach((v, i) => {
                const n = parseNum(v);
                if (n !== null && (metric.higher ? n > bestNum : n < bestNum)) { bestNum = n; bestIdx = i; }
              });
            }

            return (
              <tr key={metric.label} className="border-b border-stone-50">
                <td className="px-5 py-2.5 font-medium text-stone-600">{metric.label}</td>
                {values.map((v, i) => (
                  <td
                    key={i}
                    className={`px-5 py-2.5 ${
                      i === bestIdx ? "font-semibold text-emerald-700 bg-emerald-50/50" : "text-stone-800"
                    }`}
                  >
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
