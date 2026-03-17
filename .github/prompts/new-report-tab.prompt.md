---
mode: "agent"
description: "Scaffold a new tab in the ZoningReport"
---

Add a new report tab called **`${input:tabLabel}`** to the Toronto Zoning App.

## Steps

1. **Create `src/components/report/${input:tabId}Tab.tsx`**
   - `"use client";` at top
   - Props: `{ data: Record<string, any> }`
   - Destructure: `const eff = data.effective_standards || {}; const dev = data.development_potential || {};`
   - Use `Card`, `Row`, `SectionHeading`, `Badge` from `./primitives`
   - Follow Tailwind stone conventions from `.github/instructions/frontend.instructions.md`

2. **Register in `src/components/ZoningReport.tsx`**
   - Add to `TABS` array: `{ id: "${input:tabId}", label: "${input:tabLabel}" }`
   - Add `case "${input:tabId}":` branch in the tab content router returning `<${input:tabId|pascalCase}Tab data={data} />`
   - Add import at top of file

3. **Content guidance for this specific tab:**
   ${input:tabContentDescription}

## Constraints
- Do NOT import ZoningReport inside the new tab component
- No hardcoded bylaw URLs — use RefLink for citations
- Use `"—"` (em dash) for null fallbacks, not "N/A"
- No new npm packages unless strictly necessary
