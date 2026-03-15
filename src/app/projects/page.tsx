"use client";

/**
 * /projects — Project folders & saved reports dashboard.
 * Shows user's projects, saved lookups, and shared reports.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
// TODO: Re-add UserButton when auth is re-enabled

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Project {
  id: string;
  name: string;
  description: string;
  property_count?: number;
  created_at: string;
}

interface SavedReport {
  id: number;
  address: string;
  saved_at: string;
  lookup_data?: any;
}

interface SharedReport {
  report_id: string;
  address: string;
  view_count: number;
  created_at: string;
  expires_at: string | null;
}

type Tab = "projects" | "saved" | "shared";

export default function ProjectsPage() {
  const [tab, setTab] = useState<Tab>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [sharedReports, setSharedReports] = useState<SharedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create project state
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Add property state
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [addingProperty, setAddingProperty] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, savedRes, sharedRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/reports/save"),
        fetch("/api/reports/share"),
      ]);

      if (projRes.ok) {
        const data = await projRes.json();
        setProjects(data.projects || []);
      }
      if (savedRes.ok) {
        const data = await savedRes.json();
        setSavedReports(data.reports || []);
      }
      if (sharedRes.ok) {
        const data = await sharedRes.json();
        setSharedReports(data.reports || []);
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function createProject() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      if (res.ok) {
        setNewName("");
        setNewDesc("");
        setShowNewProject(false);
        fetchData();
      }
    } catch {
      setError("Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project and all its properties?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      setError("Failed to delete project");
    }
  }

  async function addProperty(projectId: string) {
    if (!propertyAddress.trim()) return;
    setAddingProperty(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: propertyAddress.trim() }),
      });
      if (res.ok) {
        setPropertyAddress("");
        setAddingTo(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || err.error || "Failed to add property");
      }
    } catch {
      setError("Failed to add property");
    } finally {
      setAddingProperty(false);
    }
  }

  async function deleteSharedReport(reportId: string) {
    try {
      await fetch(`/api/reports/shared/${reportId}`, { method: "DELETE" });
      fetchData();
    } catch {
      setError("Failed to delete shared report");
    }
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
            <span className="text-[14px] font-medium text-stone-600">Projects</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 shadow-sm hover:bg-stone-50"
            >
              ← Back to Lookup
            </Link>
            <Link
              href="/compare"
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 shadow-sm hover:bg-stone-50"
            >
              Compare
            </Link>
            {/* TODO: Re-add <UserButton /> when auth is re-enabled */}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-[24px] font-bold tracking-tight text-stone-900">Your Workspace</h1>
          <button
            onClick={() => setShowNewProject(true)}
            className="rounded-xl bg-stone-900 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-stone-800"
          >
            + New Project
          </button>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-xl bg-stone-100 p-1">
          {(
            [
              { id: "projects" as Tab, label: "Projects", count: projects.length },
              { id: "saved" as Tab, label: "Saved Reports", count: savedReports.length },
              { id: "shared" as Tab, label: "Shared Links", count: sharedReports.length },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
                tab === t.id
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {t.label}
              <span className="ml-1.5 rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-medium underline">
              Dismiss
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
          </div>
        )}

        {/* ── Create Project Modal ─── */}
        {showNewProject && (
          <div className="mb-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-[15px] font-semibold text-stone-900">Create Project</h3>
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name — e.g. Roselawn Infill"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] focus:border-stone-400 focus:outline-none"
                autoFocus
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-[13px] focus:border-stone-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={createProject}
                  disabled={creating || !newName.trim()}
                  className="rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800 disabled:opacity-40"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
                <button
                  onClick={() => setShowNewProject(false)}
                  className="rounded-lg border border-stone-200 px-4 py-2 text-[13px] text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Projects Tab ─── */}
        {!loading && tab === "projects" && (
          <div className="space-y-4">
            {projects.length === 0 && !showNewProject && (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
                <span className="text-[40px]">📁</span>
                <p className="mt-3 text-[15px] font-medium text-stone-700">No projects yet</p>
                <p className="mt-1 text-[13px] text-stone-400">
                  Create a project to organize properties you&apos;re analyzing.
                </p>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800"
                >
                  Create First Project
                </button>
              </div>
            )}

            {projects.map((proj) => (
              <div key={proj.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-stone-900">📁 {proj.name}</h3>
                    {proj.description && (
                      <p className="mt-0.5 text-[12px] text-stone-400">{proj.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-stone-400">
                      <span>{proj.property_count || 0} properties</span>
                      <span>Created {new Date(proj.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddingTo(addingTo === proj.id ? null : proj.id)}
                      className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-medium text-stone-600 hover:bg-stone-50"
                    >
                      + Add Property
                    </button>
                    <button
                      onClick={() => deleteProject(proj.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Add property form */}
                {addingTo === proj.id && (
                  <div className="mt-4 flex gap-2 border-t border-stone-100 pt-4">
                    <input
                      type="text"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      placeholder="Enter address — e.g. 446 Roselawn Ave"
                      className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-[13px] focus:border-stone-400 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addProperty(proj.id);
                      }}
                    />
                    <button
                      onClick={() => addProperty(proj.id)}
                      disabled={addingProperty || !propertyAddress.trim()}
                      className="rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800 disabled:opacity-40"
                    >
                      {addingProperty ? "Adding…" : "Add"}
                    </button>
                    <button
                      onClick={() => setAddingTo(null)}
                      className="rounded-lg border border-stone-200 px-3 py-2 text-[13px] text-stone-500 hover:bg-stone-50"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Saved Reports Tab ─── */}
        {!loading && tab === "saved" && (
          <div className="space-y-2">
            {savedReports.length === 0 && (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
                <span className="text-[40px]">📋</span>
                <p className="mt-3 text-[15px] font-medium text-stone-700">No saved reports</p>
                <p className="mt-1 text-[13px] text-stone-400">
                  Reports you save from lookups will appear here.
                </p>
                <Link
                  href="/dashboard"
                  className="mt-4 inline-block rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800"
                >
                  Do a Lookup
                </Link>
              </div>
            )}

            {savedReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm transition-colors hover:border-stone-300"
              >
                <div>
                  <p className="text-[14px] font-semibold text-stone-900">{report.address}</p>
                  <p className="text-[11px] text-stone-400">
                    Saved {new Date(report.saved_at).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard?address=${encodeURIComponent(report.address)}`}
                  className="rounded-lg border border-stone-200 px-3 py-1.5 text-[12px] font-medium text-stone-600 hover:bg-stone-50"
                >
                  View Report →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* ── Shared Links Tab ─── */}
        {!loading && tab === "shared" && (
          <div className="space-y-2">
            {sharedReports.length === 0 && (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
                <span className="text-[40px]">🔗</span>
                <p className="mt-3 text-[15px] font-medium text-stone-700">No shared links</p>
                <p className="mt-1 text-[13px] text-stone-400">
                  Share a report from any lookup to create a public link.
                </p>
              </div>
            )}

            {sharedReports.map((report) => (
              <div
                key={report.report_id}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm"
              >
                <div>
                  <p className="text-[14px] font-semibold text-stone-900">{report.address}</p>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-stone-400">
                    <span>{report.view_count} views</span>
                    <span>Created {new Date(report.created_at).toLocaleDateString()}</span>
                    {report.expires_at && (
                      <span>Expires {new Date(report.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/report/${report.report_id}`
                      );
                    }}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-medium text-stone-600 hover:bg-stone-50"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => deleteSharedReport(report.report_id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
