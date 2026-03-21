"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  provider: string;
  report_count: number;
  feedback_count: number;
}

interface Stats {
  total: number;
  confirmed: number;
  admins: number;
  with_reports: number;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber-100 text-amber-800 border-amber-200",
  reviewer: "bg-blue-100 text-blue-800 border-blue-200",
  user: "bg-stone-100 text-stone-600 border-stone-200",
};

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-CA");
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "last_sign_in_at" | "report_count">("created_at");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setIsAdmin(data?.role === "admin");
    });
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data.users ?? []);
      setStats(data.stats ?? null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  const filtered = users
    .filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.email?.toLowerCase().includes(q) ||
          u.full_name?.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "report_count") return b.report_count - a.report_count;
      if (sortBy === "last_sign_in_at") {
        const at = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
        const bt = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
        return bt - at;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-[14px] text-stone-500">Checking admin access…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[15px] font-bold tracking-tight text-stone-900">
              Toronto Zoning
            </Link>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/feedback" className="text-[12px] text-stone-500 hover:text-stone-900">
              Feedback Queue
            </Link>
            <Link href="/dashboard" className="text-[12px] text-stone-500 hover:text-stone-900">
              ← Back to lookup
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-stone-900">Users</h1>
            <p className="text-[13px] text-stone-500">All signed-up users and their activity</p>
          </div>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-[22px] font-bold tracking-tight text-stone-900">{stats.total}</p>
              <p className="text-[11px] text-stone-400 uppercase tracking-wide">Total Users</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-[22px] font-bold tracking-tight text-emerald-700">{stats.confirmed}</p>
              <p className="text-[11px] text-stone-400 uppercase tracking-wide">Email Confirmed</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-[22px] font-bold tracking-tight text-amber-700">{stats.admins}</p>
              <p className="text-[11px] text-stone-400 uppercase tracking-wide">Admins</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-[22px] font-bold tracking-tight text-sky-700">{stats.with_reports}</p>
              <p className="text-[11px] text-stone-400 uppercase tracking-wide">With Reports</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by email, name, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 w-64"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="reviewer">Reviewer</option>
            <option value="user">User</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
          >
            <option value="created_at">Newest First</option>
            <option value="last_sign_in_at">Last Active</option>
            <option value="report_count">Most Reports</option>
          </select>
          <span className="ml-auto text-[12px] text-stone-400">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Users table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
            <p className="text-[14px] text-stone-400">No users found</p>
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">User</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Role</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Provider</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400 text-center">Reports</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400 text-center">Flags</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Signed Up</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Last Active</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover border border-stone-200" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-[12px] font-bold text-stone-500 border border-stone-200">
                              {(u.full_name || u.email || "?")[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            {u.full_name && (
                              <p className="text-[13px] font-medium text-stone-900 truncate">{u.full_name}</p>
                            )}
                            <p className="text-[12px] text-stone-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-stone-500 capitalize">{u.provider}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[13px] font-medium ${u.report_count > 0 ? "text-stone-900" : "text-stone-300"}`}>
                          {u.report_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[13px] font-medium ${u.feedback_count > 0 ? "text-stone-900" : "text-stone-300"}`}>
                          {u.feedback_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-stone-500">
                          {new Date(u.created_at).toLocaleDateString("en-CA")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-stone-500">{timeAgo(u.last_sign_in_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {u.email_confirmed_at ? (
                          <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
