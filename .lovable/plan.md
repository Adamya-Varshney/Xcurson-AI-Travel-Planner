

## Plan: Add History Sections to Mood Match and Vibe Match

### Summary
Add collapsible history sections below the main content in both tabs, showing past mood sessions and vibe searches from the database.

### What already exists
- **`mood_sessions`** table: stores `mood_state`, `energy_level`, `planning_horizon`, `trip_mode`, `ranked_destinations`, `created_at`
- **`vibe_searches`** table: stores `image_url_temp`, `extracted_vibe`, `match_explanation`, `matched_destinations`, `created_at`
- Both have RLS policies allowing authenticated users to read their own records.

### Changes

**1. Create `src/components/discovery/MoodHistory.tsx`**
- Fetch last 10 mood sessions from `mood_sessions` ordered by `created_at desc`
- Display each as a compact card showing: mood emoji + label, energy, planning horizon, trip mode, date, and number of matched destinations
- Clicking a card restores those results into the Discover page (calls a callback with the session data)

**2. Create `src/components/vibe/VibeHistory.tsx`**
- Fetch last 10 vibe searches from `vibe_searches` ordered by `created_at desc`
- Display each as a compact card with: thumbnail from `image_url_temp`, extracted vibe summary (landscape + mood tags), number of matched destinations, date
- Clicking a card restores those results into the Vibe Match tab

**3. Update `src/pages/Discover.tsx`**
- Import and render `MoodHistory` below the mood match destinations list
- Pass a callback to restore a past mood session's destinations and mood state

**4. Update `src/components/vibe/VibeMatchTab.tsx`**
- Import and render `VibeHistory` below the vibe results / input area
- Pass a callback to restore past vibe search results (sets image preview, extracted vibe, matched destinations)

### UI Design
- Each history section has a "History" heading with a clock icon
- Cards are compact horizontal rows with key info and relative timestamps ("2h ago", "Yesterday")
- Shown as a scrollable list, max 10 items
- Empty state: "No past searches yet"

### Technical Details
- No database migrations needed — tables already have all required columns
- Uses existing Supabase client queries with RLS
- Data is fetched on component mount with `useEffect`

