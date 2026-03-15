# Plan: Progressive Loading for Faster Initial Page Load

## Problem

When a user searches an address, **everything loads in one blocking request** to `/lookup`:
- Geocoding
- 19 GIS layer queries
- Effective standards resolution
- Parcel boundary
- Front yard averaging
- Development potential
- Policy conformity
- **Nearby activity stats** (COA, building permits, dev applications)
- Zoning statistics

The `nearby_activity` computation is one of the heaviest parts. The user sees nothing until the entire payload returns.

## Current Architecture

```
User types address
        │
        ▼
SearchForm → POST /api/lookup → POST backend /lookup (does EVERYTHING)
        │
        ▼
ZoningReport renders all at once (map, tabs, nearby activity, etc.)
```

**Key observation:** The `NearbyActivityTab` already has its own refetch mechanism (`/api/nearby-activity/stats`) when the user changes the radius. So the tab is already built to receive data independently — we just need to stop bundling it in the initial `/lookup` call.

---

## Plan

### Phase 1 — Decouple nearby activity from `/lookup` (backend)

**File:** `server.py` (toronto-zoning)

Add an optional query param `include_nearby` to `/lookup` (default `true` for backward compat, but the frontend will send `false`):

```python
# In LookupRequest model, add:
include_nearby: bool = True

# In the lookup() function, wrap the nearby_stats block:
if req.include_nearby:
    nearby_stats = compute_nearby_activity_stats(...)
else:
    nearby_stats = None  # Frontend will fetch this separately
```

**Impact:** Removes the `nearby_activity_ms` time from the critical path. No breaking change — other consumers still get it by default.

### Phase 2 — Frontend: fetch nearby activity lazily

**File:** `SearchForm.tsx` (toronto-zoning-app)

Change the lookup POST body to skip nearby:
```ts
body: JSON.stringify({ address: address.trim(), include_nearby: false }),
```

**File:** `NearbyActivityTab.tsx`

On mount (or when tab becomes active), fetch nearby data if not already loaded:
```ts
useEffect(() => {
  if (nearby && nearby.overview) return; // already loaded via lookup
  if (!coords.longitude || !coords.latitude) return;
  // Fetch on mount
  handleRadiusChange(radius);
}, []);
```

This is a small change since the component already has `handleRadiusChange` which calls `/api/nearby-activity/stats`.

### Phase 3 — Lazy-load the Nearby Activity tab content

**File:** `ZoningReport.tsx`

The tab components are already conditionally rendered (only the active tab shows). Confirm the `NearbyActivityTab` only renders when `activeTab === "nearby"`. This means the fetch only fires when the user clicks the tab.

**Option A — Fetch on tab click (recommended):**
Only trigger the nearby data fetch when the user clicks the "Nearby Activity" tab. This is the fastest path to perceived performance.

**Option B — Fetch in background after initial render:**
Start fetching nearby data ~2s after the main report renders, so it's ready by the time the user clicks the tab. Use `setTimeout` or `requestIdleCallback`.

### Phase 4 — Loading states

**File:** `NearbyActivityTab.tsx`

Show a skeleton/spinner while nearby data loads independently:
```tsx
if (loading && !hasData) {
  return (
    <div className="space-y-4 py-6 animate-pulse">
      <div className="h-8 bg-stone-100 rounded-lg w-1/3" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-stone-100 rounded-lg" />
        ))}
      </div>
      <div className="h-[320px] bg-stone-100 rounded-xl" />
    </div>
  );
}
```

### Phase 5 — GIS map layers already lazy (no change needed)

The `MapPanel` already loads layers on-demand via individual `/api/map/layers/{key}` calls — only when toggled on or auto-loaded based on relevance. No changes needed here.

---

## Summary of Changes

| File | Change | Effect |
|---|---|---|
| `server.py` | Add `include_nearby` flag to `/lookup` | Skip nearby computation on initial load |
| `SearchForm.tsx` | Send `include_nearby: false` in lookup body | Faster initial response |
| `NearbyActivityTab.tsx` | Fetch nearby data on mount/tab-click if missing | Deferred load |
| `NearbyActivityTab.tsx` | Add skeleton loading state | Better UX while loading |
| `ZoningReport.tsx` | No change needed (tabs already conditionally rendered) | — |
| `MapPanel.tsx` | No change needed (layers already lazy) | — |

## Expected Impact

| Metric | Before | After |
|---|---|---|
| Initial `/lookup` response | Full payload (slow) | Core zoning data only (fast) |
| Time to first useful content | Blocked by nearby activity | Map + summary show immediately |
| Nearby Activity tab | Instant (pre-loaded) | ~1-2s load on tab click (acceptable) |
| Total data transferred | Same | Same (just split across 2 requests) |

## Implementation Order

1. Backend: add `include_nearby` param to `LookupRequest` + guard the computation
2. Frontend: send `include_nearby: false` from `SearchForm`
3. Frontend: add `useEffect` in `NearbyActivityTab` to self-fetch on mount
4. Frontend: add skeleton loading UI
5. Test end-to-end
