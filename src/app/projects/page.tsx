"use client";

/**
 * /projects — Project workspace.
 * Supabase-powered: projects, saved reports, shared links.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import UserNav from "@/components/UserNav";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  property_count?: number;
}

interface SavedReport {
  id: string;
  address: string;
  title: string | null;
  is_favorite: boolean;
  created_at: string;
}

interface SharedReport {
  id: string;
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const [projRes, savedRes, sharedRes] = await Promise.all([
        supabase
          .from("projects")
          .select("*, project_properties(id)")
          .order("updated_at", { ascending: false }),
        supabase
          .from("saved_reports")
          .select("id, address, title, is_favorite, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("shared_reports")
          .select("id, address, view_count, created_at, expires_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (projRes.data) {
        setProjects(
          projRes.data.map((p: any) => ({
            ...p,
            property_count: p.project_properties?.length ?? 0,
          }))
        );
      }
      if (savedRes.data) setSavedReports(savedRes.data);
      if (sharedRes.data) setSharedReports(sharedRes.data);
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
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please sign in to create projects"); setCreating(false); return; }

      const { error: err } = await supabase.from("projects").insert({
        user_id: user.id,
        name: newName.trim(),
        description: newDesc.trim(),
      });

      if (err) { setError(err.message); } else {
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
    const supabase = createClient();
    const { error: err } = await supabase.from("projects").delete().eq("id", id);
    if (err) setError(err.message);
    else fetchData();
  }

  async function deleteSharedReport(reportId: string) {
    if (!confirm("Delete this shared link? Anyone with the URL will lose access.")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("shared_reports").delete().eq("id", reportId);
    if (err) setError(err.message);
    else fetchData();
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
            <UserNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-[24px] font-bold tracking-tight text-stone-900">Your Workspace</h1>
          {tab === "projects" && (
            <button
              onClick={() => setShowNewProject(true)}
              className="rounded-xl bg-stone-900 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-stone-800"
            >
              + New Project
            </button>
          )}
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
          <form
            onSubmit={(e) => { e.preventDefault(); createProject(); }}
            className="mb-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
          >
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
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800 disabled:opacity-40"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="rounded-lg border border-stone-200 px-4 py-2 text-[13px] text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
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
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="block rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-stone-300"
              >
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
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteProject(proj.id); }}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </Link>
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
                  <div className="flex items-center gap-2 text-[11px] text-stone-400">
                    {report.title && <span>{report.title} · </span>}
                    <span>Saved {new Date(report.created_at).toLocaleDateString()}</span>
                    {report.is_favorite && <span className="text-amber-500">★</span>}
                  </div>
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
                key={report.id}
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
                        `${window.location.origin}/report/${report.id}`
                      );
                      setCopiedId(report.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-medium text-stone-600 hover:bg-stone-50"
                  >
                    {copiedId === report.id ? "Copied!" : "Copy Link"}
                  </button>
                  <button
                    onClick={() => deleteSharedReport(report.id)}
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
