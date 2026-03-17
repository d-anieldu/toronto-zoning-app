---
applyTo: "toronto-zoning-app/src/**/*.tsx"
---

# Frontend — React/Next.js component instructions

## Component shell
Every interactive component must start with `"use client";`. Server components are only used in `app/` route segments that do not need state or browser APIs.

## Prop pattern for report tabs
All report tab components receive a single `data` prop:
```tsx
interface Props { data: Record<string, any>; }
export default function MyTab({ data }: Props) {
  const eff = data.effective_standards || {};
  const dev = data.development_potential || {};
  const layers = data.layers || {};
}
```
Guard every nested access — properties can be `null` for former-bylaw properties.

## Primitives — always use from `./primitives.tsx`
```tsx
import { Card, Row, Badge, SectionHeading, Tag, Icons, severityColor } from "./primitives";
```
- `<Card>` — standard white card wrapper
- `<Row label="..." value="..." />` — two-column metric display row
- `<Badge variant="success|warning|danger|info|default">text</Badge>`
- `<SectionHeading>text</SectionHeading>` — uppercase stone-400 label
- `<Tag>text</Tag>` — small inline tag

## Adding a new tab
1. Create the file in `src/components/report/MyTab.tsx`
2. Add the tab to the `TABS` array in `ZoningReport.tsx`: `{ id: "mytab", label: "Label" }`
3. Add a case to the tab content router `switch` in `ZoningReport.tsx`
4. Do NOT import ZoningReport inside a tab (circular dependency)

## Tailwind conventions
```
Card bg:       rounded-xl border border-stone-200 bg-white p-5 shadow-sm
Metric value:  text-[22px] font-bold tracking-tight text-stone-900
Sub-label:     text-[11px] text-stone-400 uppercase tracking-wide
Section head:  text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-3
Grid layout:   grid grid-cols-2 gap-4   (or gap-3 for dense cards)
```

## Icons
Use Lucide React. Do NOT use emoji as functional icons. Common ones in this codebase:
`MapPin, Building2, Home, AlertTriangle, Info, CheckCircle2, XCircle, ChevronRight, FileText`

## Data formatting helpers
```tsx
const fmt = (n: number | null | undefined, decimals = 0) =>
  n == null ? "—" : n.toLocaleString("en-CA", { maximumFractionDigits: decimals });
```
Always use `" — "` (em dash) as the fallback for null/undefined display values, not `"N/A"` or `"-"`.

## Reference links
For any bylaw section references use `<RefLink>` from `ReferencePanel.tsx` — do not hardcode City of Toronto URLs.

## State management
Prefer `useState` + `useCallback` locally. Do not use context or global state inside tab components.

## Accessibility
Every `<button>` must have a `type` attribute. Interactive elements need `aria-label` if they have no visible text content.
