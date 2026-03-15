// TODO: Restore Clerk auth when re-enabling sign-in
// import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Auth is currently disabled — all users are treated as admin.
 * To re-enable: restore Clerk imports above and the original
 * isAdmin / requireAdmin implementations that checked
 * publicMetadata.role via currentUser().
 */
export async function isAdmin(): Promise<boolean> {
  return true;
}

export async function requireAdmin(): Promise<{ userId: string }> {
  return { userId: "anonymous" };
}
