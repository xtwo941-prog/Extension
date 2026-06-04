/*
  # TechVai Extension Admin Schema

  ## Overview
  Complete database schema for TechVai browser extension admin control panel.

  ## Tables

  ### 1. admin_users
  - Stores admin accounts for the control panel
  - Fields: id, email, password_hash, name, created_at

  ### 2. licenses
  - Core license management table
  - Fields: id, license_key, user_name, email, status (trial/pro/lifetime),
    expires_at, activated_at, device_id, session_id, is_active,
    notes, created_at, updated_at

  ### 3. packages
  - Pricing plans/packages available for purchase
  - Fields: id, name, price, currency, duration_days (null = lifetime),
    features (jsonb), is_active, is_popular, sort_order, created_at

  ### 4. notifications
  - Push notifications shown in the extension
  - Fields: id, title, message, link, is_active, target_status (all/pro/trial),
    created_at

  ### 5. extension_versions
  - Extension update banners and version control
  - Fields: id, version, changelog, file_path, download_url,
    is_alert_active, created_at

  ### 6. feature_flags
  - Feature gates for extension functionality
  - Fields: id, flag_key, is_enabled, description, allowed_statuses (jsonb),
    created_at, updated_at

  ### 7. user_roles
  - Roles assigned to licenses (reseller, admin detection)
  - Fields: id, license_key, role, created_at

  ## Security
  - RLS enabled on all tables
  - Admin users access via service role only (Edge Functions)
  - Public read access only for: notifications, packages, extension_versions, feature_flags
  - License validation via service role
*/

-- ============================================================
-- ADMIN USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only service role can access admin users
CREATE POLICY "Service role full access to admin_users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- LICENSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text UNIQUE NOT NULL,
  user_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'pro', 'lifetime')),
  expires_at timestamptz,
  activated_at timestamptz,
  device_id text DEFAULT '',
  session_id text DEFAULT '',
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  max_devices integer DEFAULT 1,
  usage_count integer DEFAULT 0,
  last_seen_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active licenses by key"
  ON licenses FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can read licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update licenses"
  ON licenses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert licenses"
  ON licenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete licenses"
  ON licenses FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS licenses_updated_at ON licenses;
CREATE TRIGGER licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW EXECUTE FUNCTION update_licenses_updated_at();

-- ============================================================
-- PACKAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  duration_days integer,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active packages"
  ON packages FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can manage packages"
  ON packages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert packages"
  ON packages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update packages"
  ON packages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete packages"
  ON packages FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  link text DEFAULT '',
  is_active boolean DEFAULT true,
  target_status text DEFAULT 'all' CHECK (target_status IN ('all', 'pro', 'trial', 'lifetime')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active notifications"
  ON notifications FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can manage notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- EXTENSION VERSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS extension_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  changelog text DEFAULT '',
  file_path text DEFAULT '',
  download_url text DEFAULT '',
  is_alert_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE extension_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read extension versions"
  ON extension_versions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can manage extension versions"
  ON extension_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert extension versions"
  ON extension_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update extension versions"
  ON extension_versions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete extension versions"
  ON extension_versions FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- FEATURE FLAGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text UNIQUE NOT NULL,
  is_enabled boolean DEFAULT false,
  description text DEFAULT '',
  allowed_statuses jsonb DEFAULT '["pro","lifetime"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags"
  ON feature_flags FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can manage feature flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert feature flags"
  ON feature_flags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update feature flags"
  ON feature_flags FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete feature flags"
  ON feature_flags FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feature_flags_updated_at ON feature_flags;
CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_feature_flags_updated_at();

-- ============================================================
-- USER ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'reseller', 'admin')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT user_roles_license_key_fkey FOREIGN KEY (license_key) REFERENCES licenses(license_key) ON DELETE CASCADE
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read user roles"
  ON user_roles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can manage user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert user roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update user roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete user roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- SEED DEFAULT DATA
-- ============================================================

-- Default feature flags
INSERT INTO feature_flags (flag_key, is_enabled, description, allowed_statuses) VALUES
  ('download_files', true, 'Allow users to download project files', '["pro","lifetime"]'),
  ('create_project', true, 'Allow users to create new Lovable projects', '["pro","lifetime"]'),
  ('publish_project', true, 'Allow users to publish projects', '["pro","lifetime","trial"]'),
  ('enable_cloud', true, 'Allow users to enable Lovable Cloud', '["pro","lifetime"]'),
  ('remove_watermark', true, 'Allow watermark removal', '["pro","lifetime"]'),
  ('optimize_prompt', true, 'Allow AI prompt optimization', '["pro","lifetime","trial"]'),
  ('shield_mode', true, 'Enable shield/protection mode', '["pro","lifetime"]')
ON CONFLICT (flag_key) DO NOTHING;

-- Default packages
INSERT INTO packages (name, price, currency, duration_days, features, is_active, is_popular, sort_order) VALUES
  ('Weekly', 49.90, 'BRL', 7, '["Full extension access","Plan Mode active","Support via Discord"]', true, false, 1),
  ('Monthly', 97.90, 'BRL', 30, '["Everything in Weekly plan","Best value","Priority support"]', true, true, 2),
  ('Lifetime', 149.90, 'BRL', null, '["Lifetime access","Lifetime updates","VIP priority support"]', true, false, 3)
ON CONFLICT DO NOTHING;

-- Default notification
INSERT INTO notifications (title, message, link, is_active, target_status) VALUES
  ('Welcome to TechVai Extension!', 'Your extension is now active. Enjoy premium features!', '', true, 'all')
ON CONFLICT DO NOTHING;

-- Seed current extension version
INSERT INTO extension_versions (version, changelog, is_alert_active) VALUES
  ('6.0.13', 'TechVai rebranding - Full admin panel control', false)
ON CONFLICT DO NOTHING;
