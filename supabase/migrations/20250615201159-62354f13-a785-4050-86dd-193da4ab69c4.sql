
-- 1. DROP ALL NON-ESSENTIAL/INSECURE POLICIES FIRST
DROP POLICY IF EXISTS "Allow read access to all" ON public.documents;
DROP POLICY IF EXISTS "Admins can insert/update/delete documents" ON public.documents;
DROP POLICY IF EXISTS "qual:true" ON public.documents;
DROP POLICY IF EXISTS "Anyone can select documents" ON public.documents;
DROP POLICY IF EXISTS "Only admins can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Only admins can update documents" ON public.documents;
DROP POLICY IF EXISTS "Only admins can delete documents" ON public.documents;

DROP POLICY IF EXISTS "Allow authenticated users to insert their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow users/admins to view their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow users/admins to update their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow users/admins to delete their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow admins full access to donations" ON public.donations;
DROP POLICY IF EXISTS "qual:true" ON public.donations;

DROP POLICY IF EXISTS "All access" ON public.profiles;
DROP POLICY IF EXISTS "Admin can fully access profiles" ON public.profiles;

DROP POLICY IF EXISTS "All access" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can fully access user_roles" ON public.user_roles;

-- 2. Re-enable RLS to be sure, and apply secure policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. DOCUMENTS: Public can read, only admin can create/update/delete
CREATE POLICY "Anyone can select documents"
  ON public.documents
  FOR SELECT
  USING (true);

CREATE POLICY "Admin insert documents"
  ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin update documents"
  ON public.documents
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin delete documents"
  ON public.documents
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4. DONATIONS: Only user (owner) or admin can see/modify their donation
CREATE POLICY "Donor insert"
  ON public.donations
  FOR INSERT TO authenticated
  WITH CHECK (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Donor view own or admin"
  ON public.donations
  FOR SELECT TO authenticated
  USING (
    (email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Donor update own or admin"
  ON public.donations
  FOR UPDATE TO authenticated
  USING (
    (email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Donor delete own or admin"
  ON public.donations
  FOR DELETE TO authenticated
  USING (
    (email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admin all on donations"
  ON public.donations
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. PROFILES: Only self or admin
CREATE POLICY "Admin profile full"
  ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "User can view/update own"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "User update own"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- 6. USER_ROLES: Admin only
CREATE POLICY "Admin full user_roles"
  ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7. STORAGE: Make sure bucket exists and is private for documents
DO $$
DECLARE
  _exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE name = 'documents') INTO _exists;
  IF NOT _exists THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
  ELSE
    UPDATE storage.buckets SET public=false WHERE name='documents';
  END IF;
END $$;

-- 8. Add reminder for client code: ensure file upload and admin logic doesn't use fake/fallback admin IDs anymore, always require proper login.
