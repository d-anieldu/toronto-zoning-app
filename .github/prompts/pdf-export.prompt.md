---
mode: "agent"
description: "Build the PDF export API route and download button"
---

Implement PDF export for zoning reports. This is the CRITICAL gap in MARKET_READY_PLAN.md.

## Architecture

### Option A — Puppeteer (server-side headless Chrome)
Use this if the project is deployed on a Node-capable server (not edge runtime).

### Option B — React-PDF / @react-pdf/renderer
Use this for a pure JS approach with no browser dependency.

**Use Option A (Puppeteer) unless the deployment environment prevents it.**

## Tasks

### 1. API Route: `src/app/api/export/pdf/route.ts`
```
POST /api/export/pdf
Body: { reportId: string }   OR   { data: <full lookup response object> }
Returns: PDF binary (application/pdf)
```
- Fetch the report data from Supabase if only `reportId` is provided
- Launch Puppeteer, navigate to `/report/${reportId}?print=true`, wait for `networkidle0`
- Return `response.pdf({ format: 'A4', printBackground: true })`
- Add `Content-Disposition: attachment; filename="zoning-report-{address}.pdf"` header
- Set a 30-second timeout — PDF generation can be slow

### 2. Print stylesheet
In `src/app/globals.css` add `@media print { ... }` rules:
- Hide: nav, tab bar, floating action buttons, map panel, share button
- Page breaks before each tab section
- Print-friendly font sizes (body 10pt, headings 12pt)

### 3. Download button
In `ZoningReport.tsx` floating actions area, add a PDF download button:
- Show a spinner while generating
- On error, show a sonner toast: `toast.error("PDF generation failed")`
- Button label: "Export PDF"
- Icon: `FileDown` from Lucide

### 4. Security
- Verify the user owns the report (check Supabase `reports` table `user_id`) before generating
- Rate-limit: max 5 PDF exports per user per hour
- Do not expose raw error messages to the client

## Constraints
- Puppeteer must be in `dependencies` not `devDependencies`
- Add `puppeteer` to `requirements.txt` if adding it to the Python side instead
- The print view must work at A4 size without horizontal scroll
