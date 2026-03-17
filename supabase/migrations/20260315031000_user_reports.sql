-- ============================================================
-- User Reports — Migration
-- Creates user_reports table, adds report_id FK to feedback_reports
-- ============================================================

-- =========================
-- 1. TRIGGER FUNCTION
-- =========================
-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- 2. USER_REPORTS TABLE
-- =========================
CREATE TABLE user_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address       TEXT NOT NULL,
  lookup_data   JSONB NOT NULL,
  user_edits    JSONB DEFAULT '{}'::jsonb,
  section_notes JSONB DEFAULT '{}'::jsonb,
  title         TEXT,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- 3. INDEXES
-- =========================
CREATE INDEX idx_user_reports_user ON user_reports(user_id);
CREATE INDEX idx_user_reports_address ON user_reports(user_id, address);
CREATE INDEX idx_user_reports_active ON user_reports(user_id, deleted_at);

-- =========================
-- 4. ROW LEVEL SECURITY
-- =========================
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own reports
CREATE POLICY user_reports_own ON user_reports
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read any report (needed for flag context in Phase 4)
CREATE POLICY user_reports_admin_read ON user_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =========================
-- 5. UPDATED_AT TRIGGER
-- =========================
CREATE TRIGGER user_reports_updated_at
  BEFORE UPDATE ON user_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =========================
-- 6. FEEDBACK_REPORTS FK
-- =========================
ALTER TABLE feedback_reports
  ADD COLUMN report_id UUID REFERENCES user_reports(id) ON DELETE SET NULL;

CREATE INDEX idx_feedback_reports_report
  ON feedback_reports(report_id) WHERE report_id IS NOT NULL;
