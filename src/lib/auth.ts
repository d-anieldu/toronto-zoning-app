import { createServerSupabase } from "./supabase-server";
import { NextResponse } from "next/server";

export async function getUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * For API route handlers. Returns the authenticated user or a 401 Response.
 * Usage:
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth;
 *   const user = auth;
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin";
}

export async function requireAdmin(): Promise<{ userId: string }> {
  const admin = await isAdmin();
  if (!admin) throw new Error("Unauthorized");
  const user = await getUser();
  return { userId: user!.id };
}
