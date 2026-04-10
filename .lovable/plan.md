
# AI Travel Discovery App — Build Plan (5 Features)

## F1: Foundation Layer — User Profile System + Dashboard
**Goal:** Auth, onboarding wizard, dashboard, profile, and trips overview.

### Database (Supabase)
- Set up Supabase with Auth (Email OTP + Google OAuth)
- Create tables: `user_profiles` (all profile dimensions as JSONB columns), `trips` (status: planning/booked/completed), `bookings`
- RLS: users see only their own rows

### Screens
1. **6-step onboarding wizard** — tap-based multi-step flow collecting: who you are, where you live, how you travel, what you eat, what you love, past trips. No backend calls until final submit.
2. **Dashboard home** — active trips, saved destinations, recent plans, quick mood picker
3. **Profile view/edit** — inline editing across all 4 dimension groups (place, experience, cultural, food prefs)
4. **Trips overview** — tabs for Planning / Booked / Completed, each card links to itinerary

### AI Integration
- Edge Function: on onboarding submit → call Claude 3.5 Sonnet to infer structured travel preferences from freeform answers → upsert `user_profiles`
- Compute `experience_level` tag (first_timer / building / experienced)

---

## F2: Discovery Engine — Mood-to-Destination + Personalised Feed
**Goal:** Mood check-in, AI-ranked discovery feed, destination details, trip mode switcher.

### Database
- Create `destinations` table (name, country, landscape_type, crowd_level, pace, mood_affinities JSONB, experience_tags, dietary_friendly, visa_status, budget_level, freshness_score, trend_direction)
- Seed with 200+ curated destinations
- Create `mood_sessions` table (user_id, mood_state, energy_level, planning_horizon, expires_at with 6h TTL)
- Create `destination_saves` junction table

### Screens
1. **Mood check-in overlay** — shown on app open, 2-tap: emotional state (burned_out/adventurous/social/reflective) + planning horizon. Skip option uses last mood.
2. **Discovery feed** — destination cards ranked by mood + profile fit, showing freshness meter, rising badge, fit score, visa chip, crowd bar
3. **Destination detail** — match explanation, experience highlights, budget estimate, "Add to trip" CTA
4. **Trip mode switcher** — Solo/Partner/Group/Family toggle, re-ranks feed + adjusts per-head costs

### AI Integration
- Edge Function: Gemini 1.5 Flash — mood + profile → ranked destination IDs with fit scores and match reasons (target <300ms)
- Feed re-rank on trip mode switch (cached per mode per session)

---

## F3: Visual Vibe Matching
**Goal:** Upload/paste/capture an image → extract travel vibe → match to destinations.

### Database
- Create `vibe_searches` table (user_id, image_url_temp, extracted_vibe JSONB, match_explanation, matched_destinations JSONB, created_at)
- Supabase Storage: temp image bucket with 24h TTL policy

### Screens
1. **Vibe input screen** — image upload dropzone, URL paste, camera capture
2. **Vibe extraction loading** — shown during Gemini Vision processing (~1.5-3s), streaming attribute tags appear
3. **Match results grid** — destination cards ranked by vibe similarity with extracted tags, match score bar, explanation text

### AI Integration (Edge Functions)
- Gemini 1.5 Pro Vision: image → extract {landscape_type, crowd_density, pace, light_quality, primary_activity, mood_tags[]} + match explanation
- Gemini 1.5 Flash: vibe JSON + user profile → ranked destination matches
- Flow: Upload → Storage temp bucket → Edge Function → base64 → Gemini → results saved → image deleted

---

## F4: Itinerary Creator (Basic)
**Goal:** AI-generated day-by-day itinerary with editing capabilities.

### Database
- Create `itineraries` table (trip_id FK, title, cities[], days_count, content JSONB, edit_history JSONB[] max 5, is_user_edited, generated_by, total_est_cost_inr)

### Screens
1. **Itinerary setup** — city input, duration stepper, trip mode selector → AI generates draft immediately
2. **Day-by-day editable view** — time-block cards (morning/afternoon/evening), inline edit, drag reorder, AI re-suggest button per slot
3. **Itinerary summary** — city timeline, cost breakdown, save to trip, share link
4. **AI edit assistant** — natural language input bar ("Swap Day 3 afternoon for something vegetarian near a temple"), streaming response, accept/reject diff view

### AI Integration (Edge Functions)
- Gemini 1.5 Pro: generate full itinerary (streamed) — day_number, city, morning/afternoon/evening activities with cost_inr
- Claude 3.5 Sonnet: natural language edit — applies only requested change, flags constraint conflicts, returns diff
- Gemini 1.5 Flash: single-slot re-suggest — 3 alternatives for one time slot

---

## F5: Requirements Wizard + AI Generation (9-Step Flow)
**Goal:** Detailed 9-step wizard capturing trip requirements → enhanced AI itinerary generation with constraint validation.

### Database
- Create `itinerary_requirements` table with JSONB columns for each step: destination, dates, group_info, commute, accommodation, budget, activities, rhythm, constraints + step_completed (1-9) for resume
- Extend `itineraries` with: requirements_id FK, budget_summary JSONB, constraint_report JSONB

### Screens (9-step wizard, each step full-screen tap-based)
1. **Where to** — city chips with autocomplete, drag-to-reorder, up to 5 cities, flexible toggle
2. **When & how long** — fixed date picker OR duration tiles + season selector
3. **Who's coming** — trip mode + traveller count, children ages conditional on family
4. **Getting around** — intercity + local transport modes (multi-select), flight class conditional
5. **Where to stay** — accommodation type → class, private room toggle, amenities
6. **Budget** — total trip or per-person-per-day toggle, quick-range tiles or custom input, flexibility
7. **Activities** — multi-select chips, first 3 = priority, long-press = avoid, freeform note
8. **Daily rhythm** — pace (packed/balanced/relaxed) + start time + evening preference
9. **Special needs** — dietary + accessibility + cultural (pre-filled from profile), freeform note

### Post-wizard
- **Generation screen** — streaming day cards render progressively, constraint flag chips on violations, budget bar (estimated vs stated)
- Auto-save Edge Function on each step completion for resume-on-close

### AI Integration (Edge Functions)
- Gemini 1.5 Pro (streamed): merged 9-step requirements → full itinerary with cost constraints, dietary rules, pace matching
- Claude 3.5 Sonnet (parallel): constraint validation — budget check, dietary compliance, cultural conflict detection → violation flags with swap suggestions
- Claude NL edit + Gemini Flash re-suggest (same as F4)
- Save to trip → appears on Dashboard under Planning
