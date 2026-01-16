-- CAMANO Mission Control - Supabase Schema
-- Run this in Supabase SQL Editor to set up the database

-- Team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Import history table (stores full JSON for rollback)
CREATE TABLE imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  exported_at TIMESTAMPTZ NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  week_start DATE NOT NULL,
  raw_data JSONB NOT NULL,
  is_current BOOLEAN DEFAULT false,
  targets JSONB,
  activity_count JSONB,
  prospect_count INTEGER,
  won_count INTEGER,
  won_revenue NUMERIC(12,2)
);

-- Index for quick lookups
CREATE INDEX idx_imports_member ON imports(team_member_id);
CREATE INDEX idx_imports_current ON imports(team_member_id, is_current) WHERE is_current = true;

-- Activities table (normalized for queries)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID REFERENCES imports(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT,
  notes TEXT,
  timestamp TIMESTAMPTZ,
  week_of DATE
);

CREATE INDEX idx_activities_member ON activities(team_member_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_week ON activities(week_of);

-- Prospects table (normalized for pipeline view)
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID REFERENCES imports(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  stage TEXT NOT NULL,
  deal_value NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ,
  last_touch TIMESTAMPTZ,
  won_at TIMESTAMPTZ
);

CREATE INDEX idx_prospects_member ON prospects(team_member_id);
CREATE INDEX idx_prospects_stage ON prospects(stage);

-- Disable Row Level Security (no auth required)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth)
CREATE POLICY "Allow all on team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on imports" ON imports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on activities" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on prospects" ON prospects FOR ALL USING (true) WITH CHECK (true);
