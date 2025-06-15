
-- 1. Create roles enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 3. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamp with time zone default now()
);

-- 4. Admin detection function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = _user_id AND public.user_roles.role = 'admin'
  );
$$;

-- 5. Enable RLS on documents and donations
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- 6. Document policies
CREATE POLICY "Allow read access to all" ON public.documents
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert/update/delete documents" ON public.documents
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7. Donations: Insert policy (as before)
CREATE POLICY "Allow authenticated users to insert their own donations" ON public.donations
  FOR INSERT TO authenticated WITH CHECK (true);

-- 8. Donations: Split select, update, delete policies to avoid SQL error
CREATE POLICY "Allow users/admins to view their own donations" ON public.donations
  FOR SELECT TO authenticated
  USING (
    (donations.email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Allow users/admins to update their own donations" ON public.donations
  FOR UPDATE TO authenticated
  USING (
    (donations.email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Allow users/admins to delete their own donations" ON public.donations
  FOR DELETE TO authenticated
  USING (
    (donations.email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Allow admins full access to donations" ON public.donations
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 9. Remove old "qual: true" policies if any exist
DROP POLICY IF EXISTS "qual:true" ON public.documents;
DROP POLICY IF EXISTS "qual:true" ON public.donations;
