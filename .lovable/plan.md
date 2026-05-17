## Trip Assist — wire in the Purpose Engine system prompt

Replace the placeholder system prompt with the user's "Xcurson Purpose Engine" spec, switch both edge functions to its strict JSON schemas, and upgrade the UI to render the richer output (named recommendations, price bands, insider tips, follow-up prompts).

### 1. Edge function: `trip-assist-reasons`

- Replace the inline prompt with the full Purpose Engine system prompt as `SYSTEM_PROMPT` (stored as a const).
- Send it via Gemini's `systemInstruction`. User turn is a compact JSON block:
  ```json
  { "task": "suggest_reasons",
    "destination": "...",
    "current_date": "<ISO today>",
    "user_home_city": "...", "user_home_country": "...",
    "user_age_band": "...", "past_trip_purposes": [...] }
  ```
- Pull `user_home_city/country`, age, past trip purposes from `user_profiles` (server-side) so the model gets real signals — no client trust needed.
- Keep `responseMimeType: application/json`.
- Validate response shape: require `task_echo === "suggest_reasons"` and a `reasons` array of 4–6 items. Map to the existing frontend shape (`label`, `icon`, `description`) while ALSO returning the full structured reason objects (so the UI can show tagline, dates, category color).
- On `task_echo === "error"` from the model, surface `error_message`.

### 2. Edge function: `trip-assist-recommend`

- Same `SYSTEM_PROMPT` constant (single source of truth — extract to a shared file `supabase/functions/_shared/purpose-engine-prompt.ts`).
- User turn:
  ```json
  { "task": "generate_recommendations",
    "destination": "...", "current_date": "...",
    "selected_reason": { full reason object from Task A },
    "user_query": "...",
    "user_home_city": "...", "user_home_country": "...", "user_age_band": "..." }
  ```
- Accept a new `user_query` field from the client (currently we only send `reason`). The flow becomes: pick reason → ask a question → get recommendations.
- Use `responseMimeType: application/json`. Parse and validate the Part 3 schema.
- Persist to `trip_assist_queries`: store the full structured JSON in `response_md` (rename usage — keep column, store JSON string) OR add a new `response_json jsonb` column. **Recommended: add `response_json jsonb` column** via migration, keep `response_md` for backwards compatibility (null going forward). Also store `user_query` (new column) and `selected_reason_category`.

### 3. DB migration

Add to `trip_assist_queries`:
- `user_query text` (nullable)
- `response_json jsonb` (nullable)
- `selected_reason_category text` (nullable)
- `answer_summary text` (nullable, for fast history previews)

Existing rows remain valid; new flow writes the new columns.

### 4. Frontend: `TripAssistTab.tsx` — new 4-step flow

Steps become: `destination` → `reason` → **`question`** (new) → `result`.

- **Reason step**: render the richer reason objects — show `title`, `tagline`, `icon_hint` (mapped to lucide icon or emoji fallback), `category` chip, `approximate_dates` if present, confidence-driven subtle styling for low-confidence fallbacks. Custom-reason input stays.
- **Question step (new)**: after a reason is picked, show a textarea: "What do you want to know?" with 3–4 suggested starter chips based on the chosen category (e.g. for `wedding_family`: "Where do I shop for outfits?", "What gift do I bring?", "Etiquette tips"). Submit → call recommend.
- **Result step**: replace markdown rendering with a structured layout:
  - `answer_summary` as the lede.
  - Recommendation cards: title, neighborhood badge, price band pill, why-it-fits line, details paragraph, "Insider tip" callout, tags.
  - Optional sections: `what_to_pack` (chips), `watch_outs` (warning callout), `data_freshness_warning` (subtle banner).
  - `follow_up_prompts` rendered as 3 tappable chips that jump back into the question step with that text prefilled (same destination + reason, new query).
  - Keep Copy button (copies a formatted text version).
- History: show `destination · reason · answer_summary` preview. Opening a history item restores the full structured result.

### 5. Files touched

```text
supabase/functions/_shared/purpose-engine-prompt.ts   (new)
supabase/functions/trip-assist-reasons/index.ts        (rewrite prompt + parsing)
supabase/functions/trip-assist-recommend/index.ts      (rewrite prompt + parsing + accept user_query)
supabase/migrations/<new>.sql                          (add 4 columns)
src/components/discovery/TripAssistTab.tsx             (4-step flow + new result UI)
mem://features/trip-assist.md                          (update spec)
```

### Open questions before I build

1. **Suggested-question starter chips on the new Question step** — auto-generate them from the selected reason's category (hardcoded mapping in frontend), or ask Gemini for 3 starters as part of the reasons response? Hardcoded is faster + free; AI-generated is more tailored.
2. **History storage** — OK to add the 4 new columns and have new entries skip `response_md`? Old entries (already saved) will keep rendering as markdown via a fallback path.
