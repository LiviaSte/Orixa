# Orixa — Product Requirements Document

## 1. Overview

Orixa is an omnichannel customer-data platform for pharmaceutical commercial teams. It centralises data about Healthcare Professionals (HCPs), Healthcare Organisations (HCOs), Pharmacists, and anonymous lead signals; computes per-account ICP and Engagement scores; and exposes prioritisation views for field and digital outreach.

**Primary user**: Omnichannel Manager (Alex Johnson persona).
**Secondary users**: Sales reps, MSLs, marketing operations.

**Top-level goals**
- Unify enterprise data sources (CRM, ERP, marketing cloud, congress data, contact lists) into a single account record.
- Resolve identity conflicts when the same entity appears in multiple sources.
- Configure ICP and Engagement scoring models per entity type (HCP, HCO, anonymous signal).
- Surface prioritised lists with filtering, search, and drill-down to per-account score detail.
- Maintain a structured product catalogue (therapeutic area → franchise → range/SKU) used to scope scoring.

## 2. Glossary

| Term | Definition |
|------|------------|
| HCP | Healthcare Professional — a doctor, nurse, or other clinician in the customer database. |
| HCO | Healthcare Organisation — a hospital, clinic, or institution. |
| Pharmacist | A licensed pharmacist working in a community, hospital, or specialty pharmacy. |
| ICP | Ideal Customer Profile — fit score (0–100) based on static attributes. |
| Engagement Score | 0–100 score measuring depth and breadth of recent interactions. |
| Signal Score | Raw integer used for HCOs: Σ(signal_weight × count) of anonymous digital touchpoints. |
| Trajectory | Trend arrow (↑↑, ↑, →, ↓, ↓↓) comparing current period vs. prior period. |
| KOL | Key Opinion Leader — flag identifying high-influence HCPs. |
| NBA | Next Best Action — recommended outreach for a score band. |
| Tier (engagement event) | One of: Reach, Interaction, Engagement, Advocacy. |
| Cap | Optional per-event maximum on how many times an event contributes to a score. |
| Source | A connector + file + column path used to feed a scoring variable. |

## 3. Features

Each feature below uses the structure: **Description → User Stories → Functional Requirements → Acceptance Criteria → Out of Scope / Limitations**.

---

### 3.1 Data Sources

**Description**
A central page for connecting and managing the enterprise data files that feed every other module. Users upload spreadsheets, see recommended data domains, and review the mapping status of each file against Orixa's canonical schema.

**User Stories**
- As an Omnichannel Manager, I want to upload data files (Sales, Customers, Products, Congress, Contacts) so that downstream scoring and profiles can work.
- As an Omnichannel Manager, I want to see at a glance which recommended domains have been connected and which haven't.
- As an Omnichannel Manager, I want to see the mapping status of each uploaded file so I know what still needs attention.

**Functional Requirements**
- Page header: title, description, and a primary "Upload database" button (top-right, same height as the page title).
- Recommended Data Domains section: cards for each suggested domain (e.g. Sales, Contacts/Doctors, Congress) with state badges (Mapped / Not uploaded). Clicking a card navigates to the relevant upload or mapping flow.
- Uploaded Databases table: file name, format, upload date, status pill. Clicking a row opens that file's mapping detail.
- Status pill rules:
  - All columns mapped → green "Mapped"
  - Some columns mapped → amber "X/Y mapped"

**Acceptance Criteria**
- Given a file has been uploaded, when the user opens Data Sources, then the file appears in the Uploaded Databases table.
- Given a file has every column mapped, when shown in the table, then its status pill is green and reads "Mapped".
- Given a file has unmapped columns, when shown in the table, then the pill is amber and shows "X/Y mapped".
- Clicking any row in the Uploaded Databases table navigates to the column-level mapping view for that file.

**Out of Scope / Limitations**
- File parsing is not validated against schema (any .xlsx is accepted).
- No bulk upload or folder watch.
- Historical versioning of a file is not supported (re-uploading replaces).
- Manual column-mapping is supported but no auto-suggestions other than naive name matching.

---

### 3.2 Column Mapping (Upload Mapping)

**Description**
The column-level view that maps each column in an uploaded file to a canonical Orixa system field, with AI-confidence indicators and a preview of the actual data.

**User Stories**
- As an Omnichannel Manager, I want to see sample values from each column so I can verify the auto-mapping suggestion.
- As an Omnichannel Manager, I want to manually re-map any column the AI got wrong.
- As an Omnichannel Manager, I want to filter to "unmapped only" so I can quickly finish an incomplete mapping.

**Functional Requirements**
- Header shows the file name and total mapped vs. total columns.
- Table columns: File Column (name + type), Preview Data (one sample value), Orixa Column (searchable dropdown), AI Confidence (% bar), Status (Mapped / Unmapped).
- Searchable dropdown with all canonical Orixa system fields plus descriptions.
- Toggle to show only unmapped columns.
- Save / Cancel / Delete actions on the file record.
- Edit / View modes: existing files open read-only and switch to edit mode via an explicit Edit button.

**Acceptance Criteria**
- Given a freshly uploaded file, when the page loads, then naive auto-mapping is applied to columns whose names match Orixa fields.
- Given a column with status "Unmapped", when the user picks an Orixa field, then the row's status flips to "Mapped" and a confidence value appears.
- Given the user toggles "show unmapped only", when applied, then only rows with status "Unmapped" are shown and pagination is recomputed.

**Out of Scope / Limitations**
- AI confidence is heuristic, not learned.
- No multi-column composite mappings (e.g. concatenating First Name + Last Name into Full Name).
- No data type coercion or validation rules per field.

---

### 3.3 Identity Resolution (Conflict Resolution)

**Description**
When the same entity (HCP, HCO, or Pharmacist) appears in multiple uploaded files with conflicting values, Orixa flags the conflict and lets the user pick the correct value attribute by attribute.

**User Stories**
- As an Omnichannel Manager, I want to see at the top of the Profiles list how many conflicts need my attention.
- As an Omnichannel Manager, I want to compare conflicting attribute values side by side and choose which one to keep.
- As an Omnichannel Manager, I want a clear distinction between "possible duplicate" and "same name, different entity" cases.

**Functional Requirements**
- Banners on the Profiles tab for each entity type: "X conflicts detected. Please review and resolve them" + "Review conflicts" CTA.
- Conflict detail view per entity: side-by-side comparison of new value vs. existing value, per attribute, with status (match / conflict).
- Conflict types: `possible_duplicate`, `same_name_different_entity`. Each conflict shows the source file and a confidence percentage.
- Resolved conflicts persist across sessions so the user doesn't repeat work.

**Acceptance Criteria**
- Given there are unresolved conflicts for HCPs, when the user opens the HCPs tab, then the conflict banner is shown with the correct count.
- Given a conflict has been resolved, when the user returns to Profiles, then the count decreases accordingly.
- Given all conflicts of a type are resolved, when the user views Profiles, then the banner for that entity disappears.

**Out of Scope / Limitations**
- No automatic merge — every conflict requires explicit human decision.
- No conflict history / audit log.
- No "merge and keep both" option.

---

### 3.4 Profiles — HCPs

**Description**
Master list of healthcare professionals with rich attributes (specialty, country, affiliation), ICP and Engagement scores, priority, KOL flag, funnel stage, CRM segment.

**User Stories**
- As a Sales Rep, I want to filter HCPs by product family, specialty, or affiliation so I can focus on a target list.
- As an Omnichannel Manager, I want to click an HCP's ICP score and see the breakdown of which dimensions contributed.
- As an Omnichannel Manager, I want to see the engagement trajectory for each HCP at a glance.
- As a Sales Rep, I want to drill into an HCP's profile page to see full history and edit details.

**Functional Requirements**
- Table columns: OneKey ID, HCP Name, Email, Specialty, Country, Affiliation, ICP Score, Engagement Score (with trajectory badge), Priority, KOL flag, Funnel stage, CRM Segment, Classification, Interests.
- Stakeholder filter pill (HCPs / HCOs / Pharmacists / Pharmacys / Signals).
- Top-of-table controls: Product family selector, Time range selector, search, filter sidebar, "HCP score configuration" button.
- ICP Score and Engagement Score are clickable: each opens a detail modal scoped to the HCP and selected affiliation.
- Engagement Score cell shows the score number followed by a colored trajectory badge (↑↑ / ↑ / → / ↓ / ↓↓).
- Each HCP can have multiple affiliations; an HCP row repeats per affiliation when relevant.
- Pagination footer: "Showing X–Y of Z" + numbered pages.

**Acceptance Criteria**
- Given an HCP has multiple affiliations, when listed, then one row per affiliation is rendered with the same HCP-level attributes.
- Given the user clicks an ICP score, when the modal opens, then the breakdown shows specialty fit / institutional tier / practice volume sub-scores summing (within rounding) to the total.
- Given the user clicks an Engagement score, when the modal opens, then it shows the Depth events table, Breadth, Trajectory, and Total.
- Given the user clicks the "HCP score configuration" button, when navigated, then the score config opens scoped to entity=hcp without changing the active sidebar tab.

**Out of Scope / Limitations**
- No bulk actions on the HCP list (no bulk export, bulk-tag, etc.).
- No real-time score recalculation; "Recalculated nightly" is shown as a static disclaimer.
- "Missing fields" warnings are intentionally hidden in the current cut.

---

### 3.5 Profiles — HCOs

**Description**
Hospital / institution list with sales, market share, potential revenue, ICP score, Engagement (Signal) score, priority.

**User Stories**
- As an Omnichannel Manager, I want to see the aggregated ICP score for an HCO based on its affiliated HCPs.
- As an Omnichannel Manager, I want a separate Engagement Score for HCOs that captures anonymous brand-interest signals.
- As an Omnichannel Manager, I want to drill into the Engagement Score modal and understand which signals contributed.

**Functional Requirements**
- Table columns: checkbox, Hospital Name, Sales, Market Share, Potential, City, Management, SAP, ICP Score, Engagement Score (with trajectory), Priority.
- Hospital name links to the HCO detail page.
- ICP Score is computed from affiliated HCPs and is clickable to show contributing HCPs.
- Engagement Score is a raw integer = Σ(signal_weight × count) over the period.
- Engagement Score cell: clickable number + small trajectory badge (HCO uses simplified 3-arrow set: ↑ / → / ↓).
- Engagement Score modal contents:
  - Description: anonymous digital touchpoints, do not replace HCP-level scores.
  - Section A: Detected signals this period (signal name, tier pill, count, points).
  - Filtered to Reach + Interaction tiers only.
  - Trajectory row with label + definition.
  - Total Engagement Score.

**Acceptance Criteria**
- Given an HCO has affiliated HCPs, when the ICP score is displayed, then it equals the average of the affiliated HCPs' lead scores.
- Given the user clicks the HCO Engagement Score, when the modal opens, then only Reach and Interaction signals are shown in Section A.
- Given the HCO has trajectory ↑, when the modal opens, then the trajectory row shows a green pill with "Accelerating" label.

**Out of Scope / Limitations**
- HCO-level Engagement Score does not factor in HCP-level engagement; the two scores are independent.
- Engagement and Advocacy tier signals are intentionally hidden from the HCO modal in this version.

---

### 3.6 Profiles — Pharmacists

**Description**
Licensed pharmacist list with type, specialty area, role, pharmacy, ICP score, Engagement score, sentiment, reimbursement.

**User Stories**
- As a Sales Rep, I want to find pharmacists by region or specialty area so I can plan rep visits.
- As an Omnichannel Manager, I want to see ICP and Engagement scores for pharmacists alongside HCPs.

**Functional Requirements**
- Table columns: License ID, Full Name / Title, Type, Specialty Area, Role, Associations, Pharmacy / Chain, City · Region · ZIP, Patient Volume, Top Therapeutic Areas, Top Brands, Generic Ratio, Avg Rx / mo, Rep · Frequency, Sentiment, ICP Score, Engagement Score, Reimbursement.
- ICP Score is shown as a plain number.
- Engagement Score is clickable, opens the same Engagement detail modal as HCPs (Depth + Breadth + Trajectory + Total).

**Acceptance Criteria**
- Given a pharmacist row is shown, when ICP and Engagement scores are present, then ICP appears before Engagement in the column order.
- Given the user clicks a pharmacist's Engagement score, when the modal opens, then it shows the same structure as the HCP Engagement modal.

**Out of Scope / Limitations**
- No academic affiliation, catchment area, or preferred channel column in this version (intentionally removed).

---

### 3.7 Score Configuration — Common Concepts

**Description**
The score configuration tabs let users define how ICP and Engagement scores are computed per entity type (HCP, HCO, Anonymous Signal).

**Cross-cutting Functional Requirements**
- Each block (Section) has:
  - Header with section ID badge, label, "Product-impacted" chip (where applicable), enabled/disabled toggle, removed-rows count, and a chevron to collapse/expand.
  - Body with rows of variables/events.
  - Block-level over-budget banner when sum of variable maxima exceeds the section's `maxPoints`. Banner copy:
    - **"Punteggio massimo superato di X pt(s)"** in bold red
    - Subtitle: *"La somma dei valori delle variabili (X pts) supera il limite del blocco (Y pts)."*
- "Close all / Open all" button at the top of the section list to toggle every section.
- Collapsed-state of every section is persisted to localStorage; default is **all collapsed**.
- Score Bands section at the bottom of each ICP tab maps score ranges to actions (NBA / engagement model).

**Acceptance Criteria**
- Given the sum of a block's variable maxima exceeds the block max, when displayed, then a red banner appears between the rows and the footer; individual rows show no inline error.
- Given the user closes a section and refreshes the page, when re-opened, then the section is still closed.
- Given the user clicks "Close all", when the click fires, then every section in the active tab collapses.

**Out of Scope / Limitations**
- No version history / "publish" workflow — every change is live.
- No per-user permissions (all users can edit configuration).
- No formula-builder; weights are simple multiplications.

---

### 3.8 Score Configuration — HCP ICP Score

**Description**
Configurable ICP score for HCPs across four blocks: A — Profile Fit, B — Role & Influence, C — HCO ICP, D — Research & Academic Activity.

**User Stories**
- As an Omnichannel Manager, I want to define which variables count toward the HCP ICP score and how many points each is worth.
- As an Omnichannel Manager, I want to know which sections are filtered by the selected product so I can interpret the score correctly.
- As an Omnichannel Manager, I want score-band actions (NBAs) to be inline-editable for fast iteration.

**Functional Requirements**
- All four blocks (A, B, C, D) display the **"Product-impacted"** chip on the title (every variable in HCP ICP is product-related).
- Each row inside a block shows: variable name, score tiers with point values, source(s).
- Per-row edit modal: read-only variable name, editable score-tier points, editable sources cascade.
- Per-row delete (soft-remove) and per-section restore via "X removed" button.
- Score Bands section displayed below the blocks, with inline-editable action text.
- All sections collapsed by default; state persisted in localStorage.

**Acceptance Criteria**
- Given the user opens the HCP ICP tab for the first time, when rendered, then all four sections are collapsed and the "Open all" button is shown.
- Given the user expands section A, when shown, then the "Product-impacted" chip is visible next to the section label.
- Given the user edits a row's points and saves, when the section is shown, then the new max contributes to the section total.

**Out of Scope / Limitations**
- HCP ICP is not filtered by time period (only by product).

---

### 3.9 Score Configuration — HCO ICP Score

**Description**
Configurable ICP score for HCOs across two blocks: A — Firmographic Variables, B — Commercial Variables.

**User Stories**
- As an Omnichannel Manager, I want to clearly see which variables in an HCO's ICP change when I switch product context.
- As an Omnichannel Manager, I want to mark exceptions explicitly so reviewers don't misread the chip.

**Functional Requirements**
- **Section A (Firmographic Variables)**: title has no Product-impacted chip; only the **Specialty departments** row shows the chip.
- **Section B (Commercial Variables)**: title shows the **Product-impacted** chip; the **Payment reliability** row shows a contrasting **"Product-independent"** chip as the documented exception.
- Same per-row edit / remove / restore behaviour as HCP ICP.
- Score Bands ("A+B - Score bands") displayed below the sections, inline-editable.
- All sections collapsed by default; state persisted in localStorage.

**Acceptance Criteria**
- Given the user expands Section A, when rendered, then only the "Specialty departments" row shows the Product-impacted chip.
- Given the user expands Section B, when rendered, then the chip appears on the title and the Payment reliability row shows "Product-independent".

**Out of Scope / Limitations**
- The visual chip currently does not actively filter the displayed score by product; it documents intent only.
- No per-period filter on firmographic variables (they are always treated as snapshot values).

---

### 3.10 Score Configuration — Engagement Score (HCP / Pharmacist)

**Description**
Configurable Engagement Score model with three components: Depth (event-tier weighted), Breadth (channel diversity), Trajectory (period-over-period trend). Used for both HCPs and Pharmacists.

**User Stories**
- As an Omnichannel Manager, I want to add new engagement events to any tier (Reach, Interaction, Engagement, Advocacy) when our marketing team launches new touchpoints.
- As an Omnichannel Manager, I want to set a per-event cap so a single high-volume event can't dominate a score.
- As an Omnichannel Manager, I want to define how many distinct channels constitute each Breadth band.
- As an Omnichannel Manager, I want to map score ranges to NBAs.

**Functional Requirements**
- **Depth Score (Section A)** — 70% of base. Event Type table with rows grouped by tier:
  - Tier groups: Reach, Interaction, Engagement, Advocacy.
  - Each tier is collapsible; "Close all / Open all" button at the section level.
  - Tier collapse state persisted to localStorage; default is **all collapsed**.
  - Per tier: list of events (Event name, Type pill, Score, **Cap**, Source pills, edit + delete actions).
  - **Cap column**: shows the configured cap value or "—" when empty (no limit).
  - **"Add event" button** at the bottom of each expanded tier opens an Add Event modal scoped to that tier.
  - Removed events are recoverable via per-tier "X removed" button.
- **Breadth Score (Section B)** — 30% of base. Distinct-channels-active scale with editable score per band.
- **Trajectory (Trend Indicator)** — full 5-arrow definition table (↑↑ / ↑ / → / ↓ / ↓↓).
- **Score Bands** — inline-editable NBA per range.
- **Add Event modal** fields:
  - Event name (required)
  - Score (numeric, default 1.0)
  - Cap (numeric, optional — empty means no limit)
  - Sources (cascade: connector → file → column)
- **Edit Event modal** fields:
  - Event name (read-only)
  - Score (editable)
  - Cap (editable, empty = no limit)
  - Sources (editable cascade)

**Acceptance Criteria**
- Given the user clicks "+ Add event" inside the Reach tier, when the modal opens, then the modal title shows the Reach pill and any saved event is added to the Reach tier.
- Given an event has cap = "" (empty), when displayed in the table, then the Cap column shows "—" in grey.
- Given an event has cap = 12, when displayed, then "12" is shown in the Cap column and the modal pre-populates the cap input with 12.
- Given a user adds 3 events in Engagement tier, removes 1, and reloads, when the page is shown again, then 2 events remain in the tier and 1 is in "removed".

**Out of Scope / Limitations**
- Cap is stored but not yet enforced in score computation (UI only).
- No per-period weight decay on events.
- No per-product filter on engagement events.

---

### 3.11 Score Configuration — HCO ICP / HCO Engagement (Signal Score)

**Description**
Configuration for the HCO Signal Score (Engagement Score on the HCO entity). Uses a simplified base-score tier table (Reach + Interaction only) and a 3-arrow trajectory.

**User Stories**
- As an Omnichannel Manager, I want a separate scoring model for anonymous institutional signals — distinct from HCP-level engagement.
- As an Omnichannel Manager, I want to edit the weight ranges and sources for each signal tier without altering individual events.

**Functional Requirements**
- **A Base score** card with columns: Event (definition), Type (tier pill), Score (weight range, blue), Examples, Sources, edit pencil.
- Only **Reach** and **Interaction** tiers shown.
- Click pencil to open the **HCOTierEditModal**: Type (read-only), Event definition (read-only), Score range (editable min/max), Sources (editable cascade).
- **Trajectory (Trend Indicator)** card listing only ↑ / → / ↓ rows (Accelerating, Stable, Declining).
- No Score Bands section in this tab (only the base score table and trajectory).

**Acceptance Criteria**
- Given the user opens the HCO Engagement Score tab, when rendered, then only Reach and Interaction rows are visible in A Base score.
- Given the user opens the trajectory card, when rendered, then only 3 rows (↑, →, ↓) are shown — no ↑↑ or ↓↓.
- Given the user clicks a row's pencil, when the modal opens, then the score range can be edited and saved.

**Out of Scope / Limitations**
- HCO Signal Score does not aggregate HCP-level signals.
- Only Reach + Interaction tiers are exposed; Engagement and Advocacy tiers are intentionally hidden in this version.

---

### 3.12 Products

**Description**
Hierarchical product catalogue: Therapeutic Area → Franchise → Range / SKU. Used to scope scoring (product family selector elsewhere in the app) and to maintain product metadata for commercial use.

**User Stories**
- As a Product Manager, I want to manage a 3-level product hierarchy.
- As a Sales Rep, I want a fast left-rail navigator and a centre panel showing all SKUs in a franchise.
- As a Product Manager, I want each SKU to capture a rich set of attributes (regulatory status, IP, country of origin, pricing, ancillary services, etc.) so reps have full context.

**Functional Requirements**
- Top header: "Products" title, summary stats (X therapeutic areas · Y franchises · Z products), primary "New therapeutic area" button.
- Left rail:
  - Search field
  - Collapsible Therapeutic Area sections, colour-coded
  - Within each TA: list of franchises with SKU count badge and "+ Add franchise" link
- Centre panel:
  - Breadcrumb (TA › Franchise)
  - Franchise name + description
  - "+ Add product" button
  - Grid of product cards: SKU, "auto" tag for AI-completed fields, product name, core function, primary category pill, form factor, completeness footer ("X/13 fields filled")
- Product Detail modal (range detail): grouped fields (Product Context / Classification / Commercial / Compliance & Origin / IP & Constraints), each field showing source connector and read/edit affordances.
- CRUD on Therapeutic Area, Franchise, and Range via dedicated modals.

**Acceptance Criteria**
- Given the user opens Products with no manual data, when rendered, then the default Shopify-like therapeutic areas, franchises, and SKUs are pre-loaded.
- Given the user clicks a franchise in the left rail, when selected, then the centre panel updates to show that franchise's product cards.
- Given a SKU has 11 of 13 fields filled, when its card renders, then the footer shows "11/13 fields filled".

**Out of Scope / Limitations**
- No product image upload.
- No product-level analytics (sales by SKU, engagement by SKU) within this page.
- No bulk import of products.

---

### 3.13 Lead Board

**Description**
Pipeline view of leads with stage, score, and key institutions.

**User Stories**
- As a Sales Rep, I want a quick rank of the most promising leads so I can prioritise outreach.
- As a Sales Rep, I want to search by name, specialty, institution, or stage.

**Functional Requirements**
- Stages: standard pipeline (Discovery → Qualified → Proposal → Closed Won / Lost).
- Search across name, specialty, institutions, stage.
- Sortable columns; per-row details navigate to the lead's profile page.

**Acceptance Criteria**
- Given the user types "cardio" in the search, when the list updates, then only leads matching the term in any of the searchable fields are shown.

**Out of Scope / Limitations**
- No drag-and-drop stage transitions in this version.
- No team-assignment / ownership toggles.
- No inbox / activity timeline integration.

---

### 3.14 Anonymous Lead Signals

**Description**
Tab inside Profiles for anonymous online visitors not yet linked to a known HCP. Provides a separate scoring model from HCP-level engagement.

**User Stories**
- As an Omnichannel Manager, I want to see institution-level anonymous interest so I can decide whether to invest in HCP discovery outreach for cold accounts.

**Functional Requirements**
- Signals tab shows count and a list view (entity hints, recent signals, country, score).
- Per-signal detail page with anonymous activity, attributed institution (if any), and probability of identification.
- Dedicated score configuration for the Signals entity (Engagement Score model only — no ICP).

**Acceptance Criteria**
- Given the user opens the Signals tab, when rendered, then the list shows anonymous lead rows with no PII.

**Out of Scope / Limitations**
- No de-anonymisation flow.
- Score model parity with HCO Signal Score is partial; the two models are configured separately.

---

## 4. Cross-cutting Non-Functional Requirements

- **Persistence**: User-level UI state (collapse state of score sections and tiers) is persisted via localStorage; data state is in-memory React Context for this build.
- **Routing**: All app navigation uses client-side routing; refreshing on any sub-route resolves correctly.
- **Performance**: Tables paginate at sensible page sizes; modals lazy-render inputs.
- **Accessibility**: Buttons have accessible labels; chevrons rotate to indicate state; modals trap focus on open.
- **Localisation**: UI is primarily English; over-budget banners and a few configuration messages are in Italian (consistent with the team's working language for those flows).

## 5. Out of Scope (Whole Product, This Build)

- No real backend — all data lives in client-side mock data and React Context. State does not survive a full app reload (except for collapse state).
- No authentication / RBAC. The user persona "Alex Johnson" is hard-coded.
- No analytics / event tracking on user behaviour.
- No email/notification system.
- No integrations with real CRM / ERP / Marketing Cloud — connector names are illustrative.
- No compliance / audit logging.
- No multi-tenant separation.
- No mobile responsive layouts; the app is designed for desktop ≥ 1280px wide.
- No internationalisation framework — text is hard-coded.

## 6. Glossary of UI Patterns Used

- **Score detail modal**: 580 px wide, max 90 vh, scrollable body, fixed header with title and close button.
- **Editor modal**: Up to 520 px wide; fields stacked vertically; Cancel / Save action row in the footer.
- **Source pill**: small grey pill displaying `Connector › File › Column` path; optional pencil to edit when in an editor.
- **Tier pill**: small coloured pill (Reach grey, Interaction blue, Engagement violet, Advocacy green).
- **Trajectory badge**: small coloured square containing the arrow symbol; semantics: ↑↑ green, ↑ light green, → amber, ↓ orange, ↓↓ red.
- **Product-impacted chip**: violet pill with filter-list icon, used at section title or row level to indicate product-scoped variables.
- **Product-independent chip**: neutral grey pill, used as a contrasting marker for explicit exceptions inside a Product-impacted block.
