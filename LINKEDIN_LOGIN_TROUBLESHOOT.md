# LinkedIn Login — Troubleshooting Plan

## Current Setup Summary
- **Auth provider:** Clerk (`@clerk/nextjs` v6.39)
- **Clerk instance:** Development (`pk_test_` / `sk_test_` keys in `.env.local`)
- **Frontend:** Next.js on Vercel
- **Backend:** FastAPI on Railway
- **Sign-in component:** Clerk's prebuilt `<SignIn />` at `/sign-in`
- **Middleware:** `clerkMiddleware` in `src/proxy.ts`

---

## Root Cause: Development vs Production Instance

**You are currently on a Clerk _Development_ instance** (keys start with `pk_test_` / `sk_test_`).

LinkedIn (via Microsoft) **restricts OAuth apps in development mode**:
- LinkedIn OAuth apps in "unverified" mode only allow sign-in for accounts explicitly added as test users in the LinkedIn Developer Portal.
- Clerk Development instances use Clerk's shared OAuth credentials, which may not have LinkedIn enabled or may hit LinkedIn's stricter verification requirements.

### Do you need a Production instance?

| Scenario | Answer |
|---|---|
| Testing LinkedIn login yourself only | Maybe not — but you need your own LinkedIn OAuth app with test users configured |
| Allowing any user to log in with LinkedIn | **Yes** — you need a Clerk Production instance + a verified LinkedIn OAuth app |
| App is already live on a custom domain | **Yes** — Production instance required |

---

## Step-by-Step Troubleshooting

### Phase 1 — Verify LinkedIn is enabled in Clerk Dashboard

- [ ] Go to [Clerk Dashboard](https://dashboard.clerk.com) → your app → **Configure** → **SSO Connections** (or **Social connections**)
- [ ] Confirm **LinkedIn** (or "LinkedIn OIDC") is toggled ON
- [ ] If it says "Not available in development" → you need **Phase 3** (Production instance)
- [ ] If it is enabled, check if Clerk is using **shared credentials** or **custom credentials**

### Phase 2 — Use Custom LinkedIn OAuth Credentials (Dev Instance)

If LinkedIn is enabled but login fails, you likely need your own LinkedIn OAuth app:

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Create a new app (or use an existing one)
3. Under **Auth** tab:
   - Note the **Client ID** and **Client Secret**
   - Add Authorized Redirect URI:
     ```
     https://exotic-trout-63.clerk.accounts.dev/v1/oauth_callback
     ```
     _(This is derived from your publishable key — "exotic-trout-63" is your Clerk dev domain)_
4. Under **Products** tab:
   - Request access to **Sign In with LinkedIn using OpenID Connect**
   - This is required — basic profile API alone won't work
5. Back in Clerk Dashboard → LinkedIn connection → toggle to **Use custom credentials**
6. Paste your Client ID and Client Secret
7. Test sign-in

### Phase 3 — Create a Clerk Production Instance

**When you're ready to go live (or if LinkedIn won't work in Dev):**

1. **Clerk Dashboard** → your app → **Production** tab (top bar) → **Create production instance**
2. You'll get new keys:
   - `pk_live_...` (publishable key)
   - `sk_live_...` (secret key)
3. Set your **custom domain** in Clerk (e.g., `torontozoning.com`)
4. Update environment variables:

   **Vercel (frontend):**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   ```

   **Local `.env.local`** (keep dev keys here for local development):
   ```
   # Keep pk_test_ / sk_test_ for local dev
   ```

5. **LinkedIn OAuth redirect URI for production:**
   ```
   https://clerk.<your-domain>.com/v1/oauth_callback
   ```
   Or if using Clerk's hosted domain:
   ```
   https://<your-clerk-prod-domain>.clerk.accounts.dev/v1/oauth_callback
   ```

6. In Clerk Production Dashboard → SSO Connections → LinkedIn → add your custom OAuth credentials with the production redirect URI

### Phase 4 — Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| "Access denied" or blank redirect | LinkedIn OAuth app not verified | Add test users in LinkedIn Dev Portal, or get app reviewed |
| "Invalid redirect_uri" | Redirect URI mismatch | Copy exact callback URL from Clerk Dashboard → LinkedIn connection → paste into LinkedIn Dev Portal |
| Sign-in works but immediately logs out | Domain mismatch between Clerk instance and app URL | Ensure Clerk Production instance domain matches your Vercel deployment domain |
| "This social connection is not enabled" | LinkedIn not toggled on in Clerk | Enable it in Clerk Dashboard → SSO Connections |
| "OAuth error: unauthorized_client" | Using Clerk shared credentials that don't support LinkedIn | Switch to custom credentials (Phase 2) |
| Login works locally but not in production | Different Clerk keys | Verify Vercel env vars use `pk_live_` / `sk_live_` keys |

### Phase 5 — Verify End-to-End

- [ ] Sign in with LinkedIn on localhost → confirm redirect back to `/dashboard`
- [ ] Sign in with LinkedIn on production URL → confirm redirect back to `/dashboard`
- [ ] Check Clerk Dashboard → **Users** → verify the LinkedIn user appears
- [ ] Confirm `userId` flows through to API routes (check browser network tab for `Authorization` header)

---

## Quick Reference: Files That Touch Auth

| File | Purpose |
|---|---|
| `src/app/layout.tsx` | `<ClerkProvider>` wraps the app |
| `src/proxy.ts` | Clerk middleware — protects non-public routes |
| `src/lib/auth.ts` | Server-side `auth()` / `currentUser()` helpers |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Sign-in page (uses Clerk's `<SignIn />`) |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Sign-up page (uses Clerk's `<SignUp />`) |
| `.env.local` | Clerk keys + redirect URLs |

---

## TL;DR Action Items

1. **Right now:** Check Clerk Dashboard → is LinkedIn enabled under SSO Connections?
2. **If not available:** You need a Production instance (Phase 3)
3. **If enabled but broken:** Set up custom LinkedIn OAuth credentials (Phase 2)
4. **For production launch:** Create Production instance, update Vercel env vars, configure LinkedIn redirect URI
