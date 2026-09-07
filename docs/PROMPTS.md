# Inference Prompts

Status: SPEC · 2026-08-27 · SlabUploader
Prompts are server-side text files, not settings values. Read fresh on each
invocation. Shipped defaults live in `backend/app/prompts/`.

## Management

- **Location:** `/app/prompts/` inside the FastAPI container, mounted read-only
  from host `backend/app/prompts/`.
- **Editing:** Edit the text files on the host. No server restart needed.
- **Versioning:** The inference_log stores the prompt content (or hash) with each
  inference call, so you can trace which prompt version produced which result.
- **Reset-to-default:** `python -m app.prompts.reset` restores shipped defaults
  from `backend/app/prompts/`.

## Call 1 — Vision (species/character classification)

File: `/app/prompts/call1.txt`

### Purpose
Classify the slab's species, edge type, figure, and grade by analyzing
inventory photos. Constrained to choose from the synced Woo taxonomy lists.

### Inputs assembled by the server
- 1–5 inventory photos, downscaled to 1024px max
- Species leaf categories from Woo (list with IDs and brief definitions)
- Edge Type attribute terms with IDs
- Figure attribute terms with IDs
- Grade attribute terms with IDs
- User metadata: SKU, length, thickness

### System prompt (template)
```
You are an expert wood slab classifier. Analyze the provided slab photos and
return taxonomy data. Only use the values provided in the taxonomy lists — do
not invent categories or attribute values.
```

### User prompt (assembled at runtime)
```
Analyze the following wood slab photos and classify the species, edge type,
figure, and grade.

Species options (choose ONLY from this list):
  1. [species name] — [brief definition] (woo_id: <id>)
  2. ...

Edge Type options:
  - Live Edge — natural, uncut bark edge
  - Flat Sawn — squared, milled edges
  ...

Figure options:
  - Cathedral — U-shaped grain patterns
  - Burl — swirling, knotted grain
  ...

Grade options:
  - Premium — minimal defects, clean grain
  - Standard — some minor characteristics
  ...

Slab metadata: SKU={sku}, Length={length}in, Thickness={thickness}in

Return valid JSON matching this schema:
{
  "species_id": <woo_id or null>,
  "species_confidence": 0.0-1.0,
  "wood_category_ids": [<woo_id>, ...],
  "edge_type_term_id": <woo_id or null>,
  "figure_term_ids": [<woo_id>, ...],
  "figure_confidence": 0.0-1.0,
  "grade_term_ids": [<woo_id>, ...],
  "grade_confidence": 0.0-1.0,
  "character": { "type": "string", "severity": "string" },
  "inclusions": { "type": "string", "severity": "string" },
  "voids": "string",
  "checks": "string",
  "wood_categories": [
    { "name": "string", "confidence": 0.0-1.0 },
    ...
  ]
}
```

### Notes
- The taxonomy list (species, wood categories, edge type, figure, grade) is
  pulled from the **synced Woo cache only**. No hardcoded mill species list. A term
  not in the cache cannot be suggested or selected.
- Brief definitions help the model distinguish ambiguous cases
  (e.g., "quarter-sawn" vs "cathedral").
- Character/inclusions/voids/checks are free-text observations. The server
  maps them to Woo `feat-*` product tags after the call returns. WooCommerce
  is the authoritative source for feat-* tag definitions; the design does not
  duplicate them.
- **Pre-population (when `inference_enabled`):** Call 1 results are the primary
  source that fills the review screen for species, wood categories, edge type,
  figure, grade, and mapped `feat-*` tags from free-text observations.
- **Confidence gate (default threshold 0.7):**
  - Field confidence **≥ threshold** → pre-populate that field (mutable;
    user may clear or change it).
  - Field confidence **< threshold** → leave empty. Do not show the model's
    low-confidence guess as a default.
  - Call 1 does not define the ready gate. Species + figure (or any vision
    subset) is assist/prefill only. Ready is the **full named set** in AGENTS §7
    / DATA-MODEL (filled manually if Call 1 left fields empty). Species + one
    figure is not enough.
- Manual entry always wins. Call 1 is assist-only and does not gate publish.
  Full suite must pass with inference OFF. Canonical lock: AGENTS §6–7.

---

## Call 2 — Content (description prose)

File: `/app/prompts/call2.txt`

### Purpose
Generate compelling product description prose for the slab. The model writes
only the descriptive portion — dimensions, species, and measurements are
injected by deterministic templates.

### Inputs assembled by the server
- Portable Call 1 context (default: **full history resend** of Call 1 turn +
  images metadata + assistant JSON). `previous_response_id` only if
  `test-inference` recorded stateful support.
- Explicit **confirmed vs inferred** labels for species, dimensions, and other
  attributes (user overrides marked confirmed).
- Deterministic measurements: length, widths, sqft, bdft, thickness (never invented)
- Brand voice, GEO context, title/short templates
- Shared validation module rules so Call 2 assembly rejects the same invalid
  values the UI would

### System prompt (template)
```
You are a professional product copywriter for premium, one-of-a-one wood
slabs. Write compelling, natural-sounding descriptions. Use the brand voice
provided. Do not invent measurements — use only the provided data.
```

### User prompt (assembled at runtime)
```
Write product copy for this wood slab.

Species: {species}
Figure: {figure}
Character: {character description from Call 1}
Length: {length_ft}ft {length_in_remainder}in
Average width: {width_avg_in}in
Width range: {width_min_in}in to {width_max_in}in
Thickness: {thickness_in}in
Board feet: {bdft} bdft
Grade: {grade}

Brand voice: {brand_voice}
GEO context: {geo_context}

Write:
1. A compelling opening sentence about the slab
2. A paragraph describing the character, grain, color, and use cases
3. A call to action

Keep the tone appropriate for a premium lumber buyer. Do not repeat the
dimensions — those are handled by the template. Focus on the beauty and
versatility of the slab.

Return JSON: { "prose": "..." }
```

### Template assembly (server-side, after LLM returns)
The server assembles the final title and description from templates with
deterministic measurements, inserting the LLM prose where appropriate.

Example title: `{species} {length_ft}ft {length_in_remainder}in × {width_avg_in}in Wood Slab — {figure}`
Example description: `{llm_prose}. Each slab is naturally shaped — width varies
along the length at {width_min_in}in to {width_max_in}in. Sold by the slab;
dimensions as measured. {geo_sentence}`

### Notes
- The LLM never touches dimensions. Templates handle all numbers.
- No numeric-accuracy guardrail needed — dimensions never pass through the LLM.
- If `content_llm_enabled` is false, the LLM call is skipped and templates
  are used with a generic description paragraph.
- **Portable Call 1 context (issue #2):** default is full resend of Call 1 (user
  prompt + assistant JSON). Label each taxonomy value **confirmed** (user-edited)
  vs **inferred** (still from Call 1). Stateful `previous_response_id` is opt-in
  after `test-inference`. Fail closed if neither path works.

---

## Tuning workflow

1. Deploy the default prompts
2. Capture a real slab, let Call 1 run
3. Review the results against your expert judgment
4. Edit `call1.txt` to improve classification accuracy
5. Re-run Call 1 via `POST /api/v1/slabs/{id}/infer-taxon` to compare
6. Iterate until results are consistently accurate

The inference_log stores each iteration's input/output so you can track
progress across prompt versions.
