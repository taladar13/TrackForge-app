# TrackForge — Commercial Proposal (Partner Web Platform + Unified Backend)

Date: 2025-12-22  
Prepared for: [Partner]  
Prepared by: TrackForge  
Currency: ₪ (ILS) — **excluding VAT unless explicitly stated**

---

## Executive summary

TrackForge will deliver:

- A **dietitian-facing web platform** to manage clients, build **meal plans** and **workout programs**, capture **medical context**, and run **analytics/research**.
- A mobile app experience that acts as the **execution layer** for clients.
- A **single FastAPI + Postgres backend** as the system-of-record powering both web + mobile.
- A deprecation path from the partner’s **Microsoft Access** system to **PostgreSQL**, with a repeatable migration approach.

This proposal prices the work in **₪**, and includes a separate monthly line item for **AI development tools per seat** to accelerate delivery while maintaining quality and safety.

---

## Scope (V1)

### Web platform modules (V1)

- **Client CRM**
  - client intake, tags/status, assignments, notes, attachments
- **Meal plan builder**
  - food/recipe composition, weekly plan builder, nutrition panels, versioning (draft/publish), assignment to clients
- **Workout program builder**
  - exercise library, programs (weeks/sessions/exercises), prescription fields, versioning, assignment
- **Medical data**
  - client medical profile + curated dictionaries (conditions, meds, allergies) + safety warnings in builders (baseline)
- **Analytics**
  - per-client dashboards + team/clinic dashboards
  - research export jobs (admin-only initially), pseudonymized by default

### Mobile app (V1 extensions)

- Consume assigned plans (meal/workout)
- Log adherence/progress (diet logs, workout completion, body metrics)
- Support secure auth and offline-safe uploads (idempotent)

### Backend (system-of-record)

- FastAPI + Postgres
- RBAC + org boundary (single-tenant now, multi-tenant-ready)
- Audit logs for sensitive actions
- Background jobs (exports, imports, analytics refresh)

---

## Out of scope (explicitly excluded from V1 price)

These can be quoted as Phase 2+:

- Billing/invoicing/subscriptions
- Full scheduling/appointments module (beyond “next review” metadata)
- Real-time chat/messaging (beyond notes)
- Wearables integrations (Apple Health / Google Fit)
- HIPAA/GDPR certification work (we build baseline security; formal compliance is a separate track)
- Barcode scanning + external food DB enrichment
- Data warehouse (BigQuery/Snowflake) unless requested

---

## Delivery approach (phases)

We recommend starting with a short, fixed-scope **Discovery** to lock requirements, migration mapping, and acceptance criteria.

### Phase 0 — Discovery & specification (2–4 weeks)

- requirements workshops with dietitians (real workflows)
- Access data inventory + mapping plan
- UX prototypes (key screens)
- delivery plan, risks, and a revised estimate

### Phase A — Foundation (6–8 weeks)

- org boundary + roles/permissions
- staff onboarding
- CRM core (client list/detail, assignments)
- import pipeline skeleton (staging + transform hooks)

### Phase B — Meal planning core value (8–10 weeks)

- food library + recipe builder
- weekly plan builder + nutrition panel
- plan versioning + assignments
- mobile consumption + logging loop

### Phase C — Workout programs (6–8 weeks)

- exercise library + program builder
- assignment + client progress view
- volume calculations + graphs

### Phase D — Medical safety (4–6 weeks)

- medical dictionaries + client medical profile UI
- rule-driven warnings inside builders
- audit trail for sensitive edits

### Phase E — Analytics & research exports (4–6 weeks)

- dashboards (client + clinic)
- cohort filters (admin-only)
- asynchronous exports (pseudonymized by default)

### Phase F — Hardening & go-live (3–5 weeks)

- UAT support + bug-fix cycles
- performance tuning
- cutover support for Access → Postgres

---

## Estimates (hours + pricing in ₪)

### Pricing model

- We estimate in **hours** and convert to **₪** using an assumed blended rate.
- **Assumed blended rate (for budgeting): 350 ₪ / hour** (ex VAT).
- Final pricing is confirmed after Phase 0 (Discovery) because Access migration and builder complexity drive variance.

### Package options

#### Option 1 — Lean MVP (fastest time-to-value)

Includes: Phase 0 + Phase A + core of Phase B (meal plan creation + assignment + basic mobile viewing/logging), basic per-client dashboard.

- **Effort**: 1,800–2,600 hours
- **Budget (at 350 ₪/h)**: ₪630,000–₪910,000 (ex VAT)
- **Timeline**: ~12–16 weeks (assuming partner availability for reviews)

#### Option 2 — Full V1 (selected modules complete)

Includes: Phase 0 + Phases A–F as described (CRM, meal, workout, medical, analytics, exports, migration hardening).

- **Effort**: 3,200–5,000 hours
- **Budget (at 350 ₪/h)**: ₪1,120,000–₪1,750,000 (ex VAT)
- **Timeline**: ~24–32 weeks

### What’s included in the estimate

- Product/engineering leadership
- UX/UI design for the web platform
- Backend + web + mobile implementation
- Automated tests + QA cycles
- Security baseline (auth, RBAC, audit logs, rate limiting, idempotency)
- Migration pipeline approach + at least one rehearsal import + cutover support window

---

## AI-assisted delivery (best-in-class tooling) — included methodology

We intentionally use “best AI tools” to reduce cycle time and increase throughput, but **never** to skip correctness.

### Where AI accelerates delivery

- **Code generation & refactors**: scaffolding endpoints, DTOs/schemas, UI forms, query layers
- **Test generation**: unit + integration test scaffolds, edge-case enumeration
- **Migration mapping assistance**: schema diffing, field mapping drafts, anomaly detection checklists
- **Documentation**: living ADRs, API docs, runbooks, onboarding guides

### Guardrails (quality + safety)

- Human code review on all merges
- Automated test suites and regression gates
- Security scanning and secrets hygiene
- No partner/client sensitive data is pasted into consumer AI tools; we use **organization-managed accounts** and a “redact-by-default” policy
- Medical rule changes require explicit human approval and audit logging

> Important: The delivery estimates above **assume** we use AI tools as described. Without AI, we typically expect **+10–15%** more effort for the same scope.

---

## AI tools (separate line item — per seat / month)

To support the AI-assisted workflow, we propose an **AI productivity bundle** billed monthly.

### Bundle contents (examples; final vendor mix can be agreed)

- IDE assistant (e.g., Cursor Business / similar)
- Code completion + PR assistance (e.g., Copilot Business / similar)
- LLM chat for architecture/doc/test support (team/enterprise tier)
- Optional code review bot (policy-based suggestions)

### Pricing

- **AI tools bundle**: **₪650 per seat / month** (licenses + usage caps)
- **Assumed seats**: 6 (backend ×2, web ×2, mobile ×1, QA/automation ×1)
- **Monthly AI tools total**: **₪3,900 / month**

Notes:

- Seats can scale up/down monthly.
- If the partner prefers to provide their own licenses/accounts, we can remove this line item and adjust the workflow accordingly.

---

## Ongoing infrastructure & services (typical monthly)

These are operational costs paid to cloud/tooling vendors (budgetary ranges; depends on traffic/HA).

- Managed Postgres (HA + backups): ₪600–₪3,500 / month
- Redis: ₪100–₪600 / month
- Object storage (files/exports): ₪50–₪600 / month
- Monitoring/alerting (APM/logs): ₪0–₪3,500 / month
- Email provider (auth + notifications): ₪80–₪600 / month

Typical early-stage total: **~₪1,000–₪8,000 / month** (excluding human support).

### Maintenance/support (post-launch)

Two common options:

- **Retainer**: 40–120 hours/month (bug fixes, updates, small enhancements, support SLA)
- **On-demand**: billed hourly as needed

---

## Assumptions & dependencies

- Partner assigns a product owner (clinical + operational) for weekly reviews and fast decisions.
- Access exports are available in stable formats (CSV/JSON) and we can run at least one rehearsal migration.
- Medical rule set is delivered progressively; V1 focuses on **baseline** warnings and auditability.
- Mobile app changes are limited to plan consumption + logging loops in V1.

---

## Key risks (and mitigation)

- **Access data quality** (duplicates, inconsistent units, missing keys)
  - Mitigation: staging tables, repeatable transforms, reconciliation checks, rehearsal imports
- **Builder complexity** (power-user features vs simple templates)
  - Mitigation: lock “V1 builder UX” in Discovery; iterate with real dietitians
- **Analytics scale** (exports/cohorts can be expensive)
  - Mitigation: asynchronous jobs, caching, precomputed summaries, permissions + approval gates

---

## Commercial terms (recommended)

### Payment structure

- **Discovery (Phase 0)**: fixed fee, payable 50% upfront / 50% on delivery
- **Build phases**: monthly invoicing based on delivered milestones (or time & materials with weekly reporting)
- VAT added per invoice as required.

### Change control

Any scope changes after Discovery are handled via:

- written change request
- impact assessment (hours/timeline)
- approval before implementation

### Acceptance

Each phase includes acceptance criteria; sign-off happens in staging before promotion to production.

---

## Next steps

1. Confirm partner stakeholders and timeline constraints.
2. Approve Phase 0 (Discovery) kickoff.
3. Provide Access schema/export samples for migration mapping.


