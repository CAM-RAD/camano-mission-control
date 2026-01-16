# CAMANO Mission Control - Progress Reference

## Project Overview
A manager dashboard that imports JSON exports from CAMANO Sales Tracker and aggregates data from multiple team members.

**Location:** `C:\Users\mr_ja\myLAB\projects\camano-mission-control`
**Tech Stack:** React + Vite + Tailwind CSS + Supabase
**Run Command:** `npm run dev` (runs on http://localhost:5173)
**Current Version:** 1.0.0

---

## Deployment

**Live URL:** TBD (deploy to Netlify)
**Database:** Supabase (PostgreSQL)

### Environment Variables
Create `.env.local` with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run the schema from `schema.sql`
4. Go to Settings > API and copy your project URL and anon key
5. Create `.env.local` with the credentials
6. Restart dev server

---

## Current Features

### Dashboard
- Team totals bar (emails, calls, meetings, proposals)
- Won this week scoreboard (deals + revenue)
- Member cards with progress bars
- Refresh button

### Import
- Drag & drop JSON file upload
- Multiple file support
- Auto-detects team member from userName/exportedBy
- Import history with filter by member
- Restore any previous import (rollback)
- Delete imports

### Pipeline
- Combined view of all prospects across team
- Filter by team member
- 6 stages: Cold, Contacted, Meeting, Proposal, Won, Lost
- Shows deal value and owner on each card
- Stage totals

### Reports
- Activity leaderboard (ranked by total activities)
- Shows emails, calls, meetings, proposals, total, won, revenue
- Pipeline summary (count + value per stage)

### Settings
- List all team members
- Delete team members (with confirmation)
- App version info

---

## Data Model (Supabase)

### team_members
- id (UUID)
- name (TEXT)
- created_at (TIMESTAMP)
- is_active (BOOLEAN)

### imports
- id (UUID)
- team_member_id (FK)
- exported_at (TIMESTAMP)
- imported_at (TIMESTAMP)
- week_start (DATE)
- raw_data (JSONB) - full JSON for rollback
- is_current (BOOLEAN)
- targets (JSONB)
- activity_count (JSONB)
- prospect_count (INT)
- won_count (INT)
- won_revenue (NUMERIC)

### activities
- id (UUID)
- import_id (FK)
- team_member_id (FK)
- type (TEXT)
- name (TEXT)
- notes (TEXT)
- timestamp (TIMESTAMP)
- week_of (DATE)

### prospects
- id (UUID)
- import_id (FK)
- team_member_id (FK)
- company (TEXT)
- contact (TEXT)
- stage (TEXT)
- deal_value (NUMERIC)
- last_touch (TIMESTAMP)
- won_at (TIMESTAMP)

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app with all components |
| `src/lib/supabase.js` | Supabase client + all database functions |
| `schema.sql` | Database schema for Supabase |
| `.env.local` | Supabase credentials (not in git) |

---

## Visual Style

- **Fonts:** Orbitron (headings), Space Mono (body)
- **Icons:** Pixelarticons CDN
- **Colors:** Slate-700/800 primary, green for wins
- Matches CAMANO Sales Tracker aesthetic

---

## Related Projects

- **CAMANO Sales Tracker:** `../camano-sales-tracker/`
  - Individual sales rep app
  - Exports JSON files that Mission Control imports

---

*Last Updated: January 16, 2026*
