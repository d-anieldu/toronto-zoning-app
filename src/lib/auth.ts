import { createServerSupabase } from "./supabase-server";

export async function getUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
