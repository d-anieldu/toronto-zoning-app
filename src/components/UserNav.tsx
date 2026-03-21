"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FileText, CheckCircle, Shield } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function UserNav() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from("profiles").select("role").eq("id", user.id).single()
          .then(({ data }) => setIsAdmin(data?.role === "admin"));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="rounded-lg bg-stone-900 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-stone-800 transition-colors"
      >
        Sign in
      </Link>
    );
  }

  const initials =
    user.user_metadata?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || user.email?.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-[11px] font-bold text-stone-600 hover:bg-stone-300 transition-colors"
        title={user.email ?? "Account"}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-stone-200 bg-white py-2 shadow-xl">
          <div className="px-4 py-2 border-b border-stone-100">
            <p className="text-[12px] font-medium text-stone-900 truncate">
              {user.user_metadata?.full_name || "User"}
            </p>
            <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
          </div>

          <div className="py-1">
            <Link
              href="/reports"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-[12px] text-stone-600 hover:bg-stone-50"
            >
              <FileText className="h-3.5 w-3.5" /> My Reports
            </Link>
            <Link
              href="/corrections"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-[12px] text-stone-600 hover:bg-stone-50"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Corrections Log
            </Link>
            {isAdmin && (
              <Link
                href="/admin/feedback"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-[12px] text-amber-700 hover:bg-amber-50"
              >
                <Shield className="h-3.5 w-3.5" /> Admin Dashboard
              </Link>
            )}
          </div>

          <div className="border-t border-stone-100 pt-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-4 py-2 text-[12px] text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
