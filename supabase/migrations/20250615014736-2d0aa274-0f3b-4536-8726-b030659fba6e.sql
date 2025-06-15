
-- 1. Remove existing policies
DROP POLICY IF EXISTS "Allow read access to all" ON public.documents;
DROP POLICY IF EXISTS "Admins can insert/update/delete documents" ON public.documents;
DROP POLICY IF EXISTS "qual:true" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow users/admins to view their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow users/admins to update their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow users/admins to delete their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow admins full access to donations" ON public.donations;
DROP POLICY IF EXISTS "qual:true" ON public.donations;
DROP POLICY IF EXISTS "All access" ON public.profiles;
DROP POLICY IF EXISTS "All access" ON public.user_roles;

-- 2. Enable RLS where missing
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Re-create minimal/secure policies

-- Documents: Anyone can read, only admin can mutate
CREATE POLICY "Anyone can select documents" ON public.documents
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update documents" ON public.documents
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete documents" ON public.documents
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Donations: Only allow users/admins to view/change their own, admins full access, users can insert their own
CREATE POLICY "Authenticated users can insert their own donation" ON public.donations
  FOR INSERT TO authenticated
  WITH CHECK (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users/Admins can view their own donations" ON public.donations
  FOR SELECT TO authenticated
  USING (
    (email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users/Admins can update their own donations" ON public.donations
  FOR UPDATE TO authenticated
  USING (
    (email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users/Admins can delete their own donations" ON public.donations
  FOR DELETE TO authenticated
  USING (
    (email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can fully access donations" ON public.donations
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Profiles table: Only admin can view, insert, update, delete
CREATE POLICY "Admin can fully access profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- User_roles: Only admin can view, insert, update, delete
CREATE POLICY "Admin can fully access user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. Secure storage bucket for documents (create if missing, make public for now)
DO $$
DECLARE
  _exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE name = 'documents') INTO _exists;
  IF NOT _exists THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);
  END IF;
END $$;
