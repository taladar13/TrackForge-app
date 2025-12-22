## Goal

- Produce a **partner-facing PDF** of the existing architecture/integration plan.
- Produce a **commercial proposal** in **₪ (ILS)** including delivery phases, hours, pricing ranges, and **AI tools as a separate per-seat/month line item**.
- Make PDF generation **repeatable** (scripted), not manual.

## Inputs we are using (confirmed)

- **Tenant model**: single-tenant now, multi-tenant-ready.
- **V1 web modules**: Client CRM, Meal plan builder, Workout program builder, Medical data, Analytics.
- **Compliance**: baseline health-data security (no HIPAA/GDPR commitment yet).
- **DB**: PostgreSQL.
- **Commercial**:
- Currency: **ILS (₪)**
- AI tools: **separate monthly per-seat line item** (licenses + usage caps)

## Deliverables (files)

- **Architecture plan (partner-facing)**:
- Source: `.cursor/plans/partner_b0a0236a.plan.md`
- Exported Markdown: `docs/partner/TrackForge_Partner_Plan.md`
- PDF: `docs/pdf/TrackForge_Partner_Plan.pdf`
- **Commercial proposal**:
- Markdown: `docs/proposals/TrackForge_Commercial_Proposal_2025-12-22.md`
- PDF: `docs/pdf/TrackForge_Commercial_Proposal_2025-12-22.pdf`
- **Repeatable PDF export tooling**:
- Script: `scripts/export_docs_to_pdf.sh` (or `scripts/export_docs_to_pdf.py`)
- Minimal styling: `docs/pdf/theme.css` (and optional cover page template)

## Work plan

### 1) Draft the partner-facing plan Markdown

- Copy content from `.cursor/plans/partner_b0a0236a.plan.md` into `docs/partner/TrackForge_Partner_Plan.md`.
- Remove Cursor-specific YAML frontmatter; add a clean cover section:
- Title, version/date, prepared-for/prepared-by placeholders
- Changelog section (Version 0.1)
- Keep diagrams as-is initially; if PDF pipeline supports Mermaid rendering, render; otherwise keep as code blocks.

### 2) Draft the commercial proposal Markdown (₪ + AI tooling)

Create `docs/proposals/TrackForge_Commercial_Proposal_2025-12-22.md` with:

- Executive summary (1 page)
- Scope (V1 modules) + explicit out-of-scope list
- Delivery phases (Discovery + Phases A–E) with timeline ranges
- Workstreams + estimated hours (ranges)
- Pricing in **₪**:
- Show 2 packages: **Lean MVP** vs **Full V1**
- Provide price ranges based on explicit assumed blended rate(s) (document the assumption)
- Include VAT note (excluded unless stated otherwise)
- AI-assisted delivery approach (how we use AI safely):
- Coding acceleration, test generation, documentation, migration mapping
- Guardrails: code review, tests, security scanning, audit logging, human sign-off for medical rules
- AI tools cost line item (separate):
- Per-seat/month bundle (licenses + usage caps)
- Seat assumptions (e.g., 6 seats) + adjustability
- Ongoing costs:
- Infra (Postgres/Redis/object storage/monitoring/email)
- Maintenance/support retainer options
- Risks & dependencies (Access data quality, medical rules definition, power-user builder complexity)
- Change control + acceptance process + payment terms

### 3) Implement PDF export pipeline

Goal: one command regenerates PDFs from Markdown with consistent styling.

- Preferred path: **Pandoc** if available:
- `pandoc <md> -o <pdf> --css <theme.css>` (engine chosen based on availability)
- Fallback path (if Pandoc missing):
- Render Markdown → HTML and print to PDF via headless browser (Playwright/Puppeteer).
- Output PDFs into `docs/pdf/` and keep Markdown sources in `docs/`.
- Document how to run it in `docs/README.md`.

### 4) Generate and verify PDFs

- Run the export script and confirm:
- Tables render cleanly
- Page breaks are sane
- PDFs open correctly and match the Markdown sources

## Acceptance criteria

- `docs/partner/TrackForge_Partner_Plan.md` exists and matches the current architecture plan content (cleaned for partner delivery).
- `docs/proposals/TrackForge_Commercial_Proposal_2025-12-22.md` exists and includes:
- ₪ pricing ranges + hours
- Separate AI tools per-seat/month line item