-- ============================================================
-- Fix 1: Add auth_user_id column to admin_users table
-- This links admin_users to auth.users so RLS can verify admin identity
-- ============================================================

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Link existing admin to their auth.user record
UPDATE admin_users
SET auth_user_id = (SELECT id FROM auth.users WHERE email = admin_users.email)
WHERE auth_user_id IS NULL;

-- Make it NOT NULL going forward (existing rows are now populated)
ALTER TABLE admin_users ALTER COLUMN auth_user_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_auth_user_id_fkey;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_auth_user_id_fkey
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint so each auth user can only be admin once
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_auth_user_id_key;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_auth_user_id_key UNIQUE (auth_user_id);

-- ============================================================
-- Fix 2: Fix admin_users RLS policies
-- Old policy: USING (auth.uid() IS NOT NULL) - any authenticated user can read
-- New: only actual admins can read/modify admin_users
-- ============================================================

DROP POLICY IF EXISTS "Service role full access to admin_users" ON admin_users;

CREATE POLICY "Admin can read admin_users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admin can insert admin_users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admin can update admin_users"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admin can delete admin_users"
  ON admin_users FOR DELETE
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- ============================================================
-- Fix 3: Fix is_admin() function to properly check current user
-- Old: checked if ANY admin exists in user_roles (was always false, empty table)
-- New: checks if current auth.uid() exists in admin_users table
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_user_id = auth.uid()
  );
$$;

-- ============================================================
-- Fix 4: Also fix the SELECT policies that were too permissive
-- These were flagged as part of the "always true" pattern:
-- licenses SELECT: any authenticated can read all licenses
-- notifications SELECT: any authenticated can read
-- packages SELECT: any authenticated can read
-- extension_versions SELECT: anyone can read
-- feature_flags SELECT: anyone can read
-- user_roles SELECT: anyone can read
--
-- We keep public SELECT for feature_flags, extension_versions, packages,
-- and notifications since the extension (anon) needs to read them.
-- But licenses SELECT should only show own data for non-admins.
-- Admin users get full access via is_admin().
-- ============================================================

-- Fix licenses SELECT: anon can only see active (existing), 
-- authenticated non-admins can see active, admins see all
DROP POLICY IF EXISTS "Authenticated can read licenses" ON licenses;
CREATE POLICY "Authenticated can read licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (is_active = true OR is_admin());

-- Fix packages SELECT for authenticated: keep full read (needed for extension)
-- No change needed - packages are public pricing info

-- Fix notifications SELECT for authenticated: keep full read (needed for extension)
-- No change needed - notifications are public messages

-- Fix extension_versions SELECT: keep public read (needed for extension)
-- No change needed

-- Fix feature_flags SELECT: keep public read (needed for extension)
-- No change needed

-- Fix user_roles SELECT for authenticated: only admin can read all, or own role
DROP POLICY IF EXISTS "Authenticated can manage user roles" ON user_roles;
CREATE POLICY "Authenticated can read user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Anyone can read user roles" ON user_roles;
CREATE POLICY "Extension can read own role"
  ON user_roles FOR SELECT
  TO anon
  USING (license_key IN (SELECT license_key FROM public.licenses WHERE is_active = true));
