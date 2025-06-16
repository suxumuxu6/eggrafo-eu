
-- Update RLS policies for chatbot_replies to allow service role access
-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can insert chatbot replies" ON public.chatbot_replies;
DROP POLICY IF EXISTS "Admins can update/delete/select chatbot replies" ON public.chatbot_replies;

-- Create new policies that allow service role to bypass RLS
CREATE POLICY "Service role can manage chatbot replies" 
  ON public.chatbot_replies
  FOR ALL 
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
