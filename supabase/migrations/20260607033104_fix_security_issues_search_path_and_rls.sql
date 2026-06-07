-- ============================================================
-- FIX 1: Function Search Path Mutable
-- Set fixed search_path on trigger functions to prevent search_path injection
-- ============================================================

CREATE OR REPLACE FUNCTION update_licenses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- FIX 2: RLS Policy Always True
-- Replace permissive policies with admin-only write access
-- Admin check: user must have 'admin' role in user_roles table
--   OR be accessing via service_role (edge functions)
-- ============================================================

-- Helper: check if the current authenticated user is an admin
-- (has a license_key in user_roles with role = 'admin')
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE role = 'admin'
    LIMIT 1
  );
$$;

-- ============================================================
-- LICENSES TABLE: Replace permissive write policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated can update licenses" ON licenses;
DROP POLICY IF EXISTS "Authenticated can insert licenses" ON licenses;
DROP POLICY IF EXISTS "Authenticated can delete licenses" ON licenses;

CREATE POLICY "Admin can update licenses"
  ON licenses FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can insert licenses"
  ON licenses FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete licenses"
  ON licenses FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- PACKAGES TABLE: Replace permissive write policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated can insert packages" ON packages;
DROP POLICY IF EXISTS "Authenticated can update packages" ON packages;
DROP POLICY IF EXISTS "Authenticated can delete packages" ON packages;

CREATE POLICY "Admin can insert packages"
  ON packages FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update packages"
  ON packages FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete packages"
  ON packages FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- NOTIFICATIONS TABLE: Replace permissive write policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated can update notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated can delete notifications" ON notifications;

CREATE POLICY "Admin can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- EXTENSION_VERSIONS TABLE: Replace permissive write policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated can insert extension versions" ON extension_versions;
DROP POLICY IF EXISTS "Authenticated can update extension versions" ON extension_versions;
DROP POLICY IF EXISTS "Authenticated can delete extension versions" ON extension_versions;

CREATE POLICY "Admin can insert extension versions"
  ON extension_versions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update extension versions"
  ON extension_versions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete extension versions"
  ON extension_versions FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- FEATURE_FLAGS TABLE: Replace permissive write policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated can insert feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Authenticated can update feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Authenticated can delete feature flags" ON feature_flags;

CREATE POLICY "Admin can insert feature flags"
  ON feature_flags FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update feature flags"
  ON feature_flags FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete feature flags"
  ON feature_flags FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- USER_ROLES TABLE: Replace permissive write policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated can delete user roles" ON user_roles;

CREATE POLICY "Admin can insert user roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update user roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete user roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (is_admin());
