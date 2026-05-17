## Trip Assist (new Discover sub-section)

A third tab in Discover that lets a user enter a destination, pick (or type) a reason for visiting from 6 AI-suggested reasons, and receive a polished, contextual recommendation from Gemini.

### User flow

1. User opens Discover → **Trip Assist** tab (third, next to Mood Match & Vibe Match).
2. User types a destination (e.g. "Jaipur"). Submit.
3. Gemini returns 6 likely **reasons to visit** (festivals, cultural events, tourism, visiting family, business, etc.), rendered as selectable chips. A free-text "Other reason…" input is also shown.
4. User picks a chip or types a custom reason and submits.
5. Gemini returns a **crisp, aesthetic recommendation** (markdown-rendered) tailored to destination + reason, using the system prompt you'll provide.
6. Result is saved to history; user can revisit past queries from a "Recent assists" list below the form.

### UI / layout

- New tab button **Trip Assist** in the existing tab switcher in `src/pages/Discover.tsx`.
- New component `src/components/discovery/TripAssistTab.tsx` orchestrating 3 steps:
  - `TripAssistDestinationInput` — single Input + submit.
  - `TripAssistReasonPicker` — 6 chips (loading skeletons while fetching) + custom reason input + back button.
  - `TripAssistResult` — markdown-rendered recommendation card with destination/reason header, copy button, "Ask another" reset, and "Save to wishlist / Create itinerary" CTAs (reusing existing patterns).
- `TripAssistHistory` — list of past queries; click to re-open the saved result.
- Styling: glassmorphism cards, Outfit/Space Grotesk typography, primary gradient accents — matches Mood Match & Vibe Match.

### Backend (edge functions)

Two new Supabase edge functions, both calling **Google AI Studio API directly** with `GOOGLE_AI_STUDIO_API_KEY` (consistent with the rest of the app):

1. `supabase/functions/trip-assist-reasons/index.ts`
   - Input: `{ destination: string }`
   - Calls Gemini (gemini-2.5-flash) with a fixed prompt to return JSON: `{ reasons: [{ label, icon, description }] }` — exactly 6.
   - Returns parsed array.

2. `supabase/functions/trip-assist-recommend/index.ts`
   - Input: `{ destination, reason, custom_reason? }`
   - Uses the **system prompt you will provide** (placeholder constant `SYSTEM_PROMPT` at top of file, clearly marked `// TODO: replace with user-provided prompt`).
   - Calls Gemini (gemini-2.5-pro for quality) and returns `{ markdown: string }`.
   - Persists the full record (destination, reason, response, user_id) to `trip_assist_queries`.

Both functions: CORS headers, JWT verification in code, input validation (Zod-style guards), error handling. `verify_jwt = false` not required (default is fine).

### Database

New migration to add a `trip_assist_queries` table:

```text
trip_assist_queries
  id              uuid PK
  user_id         uuid (not null)
  destination     text (not null)
  reason          text (not null)
  is_custom_reason boolean default false
  response_md     text
  suggested_reasons jsonb       -- the 6 chips shown (for replay)
  created_at      timestamptz default now()
```

RLS: users can SELECT / INSERT / DELETE only their own rows (`auth.uid() = user_id`). No UPDATE needed.

### Frontend wiring

- `useTripAssist` hook (`src/hooks/useTripAssist.ts`) wrapping:
  - `fetchReasons(destination)` → invokes `trip-assist-reasons`.
  - `fetchRecommendation(destination, reason)` → invokes `trip-assist-recommend`.
  - `fetchHistory()` → queries `trip_assist_queries` for current user (latest 20).
- Markdown rendering via existing `react-markdown` (or add it if not present — verify during build).
- All client calls use `supabase.functions.invoke()` with the user's session.

### Notes / open items

- **System prompt**: I'll wire a placeholder constant in `trip-assist-recommend/index.ts`. You paste the final prompt in your next message and I'll drop it in (one-line change).
- Models follow existing project convention: flash for reasons (fast/cheap), pro for the final response (quality).
- This is purely additive — no changes to Mood Match or Vibe Match logic.

### Build order

1. Migration: create `trip_assist_queries` table + RLS.
2. Edge functions: `trip-assist-reasons` and `trip-assist-recommend` (with placeholder system prompt).
3. Frontend: hook, tab component, sub-components, integrate into `Discover.tsx` tab switcher.
4. History list under the form.
5. Smoke test end-to-end in preview.