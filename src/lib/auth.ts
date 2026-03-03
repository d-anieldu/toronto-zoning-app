import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Check if the current user has the admin role.
 * Reads `publicMetadata.role` set in Clerk dashboard.
 *
 * To grant admin: Clerk Dashboard → Users → select user →
 *   Public Metadata → {"role": "admin"}
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await currentUser();
    if (!user) return false;
    const role = (user.publicMetadata as Record<string, unknown>)?.role;
    return role === "admin";
  } catch {
    return false;
  }
}

/**
 * Require admin role — returns 403 if not admin.
 * Use at the top of admin API routes.
 */
export async function requireAdmin(): Promise<{ userId: string } | Response> {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ detail: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = await isAdmin();
  if (!admin) {
    return new Response(JSON.stringify({ detail: "Forbidden — admin role required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { userId };
}
