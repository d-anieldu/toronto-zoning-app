-- ============================================================
-- Toronto Zoning — Initial Supabase Schema
-- Tables, triggers, indexes, and Row Level Security policies
-- ============================================================

-- =========================
-- 1. PROFILES
-- =========================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'reviewer')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =========================
-- 2. FEEDBACK REPORTS
-- =========================
CREATE TABLE feedback_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  address         TEXT NOT NULL,

  -- What field is wrong
  field_path      TEXT NOT NULL,
  field_label     TEXT,
  tab_name        TEXT,

  -- The correction
  current_value   TEXT,
  suggested_value TEXT,
  source_url      TEXT,
  reason          TEXT,

  -- Workflow
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'duplicate')),
  admin_notes     TEXT,
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,

  -- Metadata
  report_data     JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_status ON feedback_reports(status, created_at DESC);
CREATE INDEX idx_feedback_address ON feedback_reports(address);
CREATE INDEX idx_feedback_user ON feedback_reports(user_id, created_at DESC);

-- =========================
-- 3. CORRECTIONS LOG
-- =========================
CREATE TABLE corrections_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id     UUID REFERENCES feedback_reports(id),
  address         TEXT NOT NULL,
  field_path      TEXT NOT NULL,
  field_label     TEXT,
  old_value       TEXT,
  new_value       TEXT,
  corrected_at    TIMESTAMPTZ DEFAULT NOW(),
  corrected_by    UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_corrections_date ON corrections_log(corrected_at DESC);

-- =========================
-- 4. SAVED REPORTS
-- =========================
CREATE TABLE saved_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address      TEXT NOT NULL,
  lookup_data  JSONB NOT NULL DEFAULT '{}',
  title        TEXT,
  is_favorite  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_user ON saved_reports(user_id, created_at DESC);

-- =========================
-- 5. SHARED REPORTS
-- =========================
CREATE TABLE shared_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  address      TEXT NOT NULL,
  lookup_data  JSONB NOT NULL,
  expires_at   TIMESTAMPTZ,
  view_count   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shared_created ON shared_reports(created_at DESC);

-- =========================
-- 6. PROJECTS
-- =========================
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user ON projects(user_id, updated_at DESC);

-- =========================
-- 7. PROJECT PROPERTIES
-- =========================
CREATE TABLE project_properties (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  address      TEXT NOT NULL,
  lookup_data  JSONB NOT NULL DEFAULT '{}',
  notes        TEXT DEFAULT '',
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, address)
);

-- =========================
-- 8. ROW LEVEL SECURITY
-- =========================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrections_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_properties ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Feedback reports
CREATE POLICY "Users create feedback" ON feedback_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own feedback" ON feedback_reports
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'reviewer'))
  );
CREATE POLICY "Admins update feedback" ON feedback_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'reviewer'))
  );

-- Corrections log: public read
CREATE POLICY "Anyone reads corrections" ON corrections_log
  FOR SELECT USING (true);
CREATE POLICY "Admins insert corrections" ON corrections_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'reviewer'))
  );

-- Saved reports: user owns their data
CREATE POLICY "Users manage own saved reports" ON saved_reports
  FOR ALL USING (auth.uid() = user_id);

-- Shared reports: anyone can read, owners manage
CREATE POLICY "Anyone reads shared reports" ON shared_reports
  FOR SELECT USING (true);
CREATE POLICY "Users create shared reports" ON shared_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own shared reports" ON shared_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Projects: user owns
CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Project properties: via project ownership
CREATE POLICY "Users manage own project properties" ON project_properties
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  );
