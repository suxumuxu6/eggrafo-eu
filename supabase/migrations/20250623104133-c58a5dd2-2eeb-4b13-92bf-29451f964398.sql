
-- Phase 1: Critical RLS Policy Cleanup
-- First, drop all existing conflicting policies on documents table
DROP POLICY IF EXISTS "Allow read access to all" ON public.documents;
DROP POLICY IF EXISTS "Admins can insert/update/delete documents" ON public.documents;
DROP POLICY IF EXISTS "qual:true" ON public.documents;
DROP POLICY IF EXISTS "Anyone can select documents" ON public.documents;
DROP POLICY IF EXISTS "Admin insert documents" ON public.documents;
DROP POLICY IF EXISTS "Admin update documents" ON public.documents;
DROP POLICY IF EXISTS "Admin delete documents" ON public.documents;

-- Create clean, secure policies for documents
CREATE POLICY "Public can read documents"
  ON public.documents
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert documents"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update documents"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete documents"
  ON public.documents
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Clean up donations policies (remove duplicates)
DROP POLICY IF EXISTS "Allow authenticated users to insert their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow users/admins to view their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow users/admins to update their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow users/admins to delete their own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow admins full access to donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated users can insert their own donation" ON public.donations;
DROP POLICY IF EXISTS "Users/Admins can view their own donations" ON public.donations;
DROP POLICY IF EXISTS "Users/Admins can update their own donations" ON public.donations;
DROP POLICY IF EXISTS "Users/Admins can delete their own donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can fully access donations" ON public.donations;
DROP POLICY IF EXISTS "Donor insert" ON public.donations;
DROP POLICY IF EXISTS "Donor view own or admin" ON public.donations;
DROP POLICY IF EXISTS "Donor update own or admin" ON public.donations;
DROP POLICY IF EXISTS "Donor delete own or admin" ON public.donations;
DROP POLICY IF EXISTS "Admin all on donations" ON public.donations;

-- Create clean donations policies
CREATE POLICY "Users can insert their own donations"
  ON public.donations
  FOR INSERT
  TO authenticated
  WITH CHECK (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users and admins can view relevant donations"
  ON public.donations
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users and admins can update relevant donations"
  ON public.donations
  FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users and admins can delete relevant donations"
  ON public.donations
  FOR DELETE
  TO authenticated
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR public.is_admin(auth.uid())
  );

-- Phase 2: Storage Security Setup
-- Create documents bucket with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  true, 
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- Create secure storage policies
CREATE POLICY "Public can read documents from storage"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents');

CREATE POLICY "Admins can upload documents to storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' 
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update documents in storage"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete documents from storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Clean up chatbot_messages policies for consistency
DROP POLICY IF EXISTS "Admins can view chatbot message logs" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Admins can insert chatbot message logs" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Admins can delete chatbot message logs" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Admins can view all chatbot messages" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Admins can update/delete all chatbot messages" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Public can read chatbot messages for email replies" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Public can insert support tickets" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Public can read own support tickets" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Admins can manage all chatbot messages" ON public.chatbot_messages;

-- Create clean chatbot_messages policies
CREATE POLICY "Public can insert support tickets"
  ON public.chatbot_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can read support tickets"
  ON public.chatbot_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage chatbot messages"
  ON public.chatbot_messages
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Add security audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  user_id UUID DEFAULT auth.uid(),
  details JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log security events for monitoring
  INSERT INTO public.chatbot_messages (
    email, 
    messages, 
    support_ticket_code,
    ticket_status
  ) VALUES (
    'security@system.log',
    jsonb_build_array(
      jsonb_build_object(
        'sender', 'system',
        'text', format('Security Event: %s - User: %s - Details: %s', 
                      event_type, 
                      COALESCE(user_id::text, 'anonymous'), 
                      details::text),
        'timestamp', now()
      )
    ),
    'SEC-' || extract(epoch from now())::bigint::text,
    'closed'
  );
END;
$$;
