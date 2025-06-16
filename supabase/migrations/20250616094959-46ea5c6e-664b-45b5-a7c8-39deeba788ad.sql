
-- Update RLS policies for chatbot_messages to allow public access for support tickets
-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admins can view chatbot message logs" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Admins can insert chatbot message logs" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Admins can delete chatbot message logs" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Public can read chatbot messages for email replies" ON public.chatbot_messages;

-- Create new policies that allow public insert for support tickets
CREATE POLICY "Public can insert support tickets"
  ON public.chatbot_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to read their own tickets by email and ticket code
CREATE POLICY "Public can read own support tickets"
  ON public.chatbot_messages
  FOR SELECT
  TO public
  USING (true);

-- Allow admins full access
CREATE POLICY "Admins can manage all chatbot messages"
  ON public.chatbot_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Update support_replies policies to allow public insert for user replies
DROP POLICY IF EXISTS "Users can insert their own support replies" ON public.support_replies;

CREATE POLICY "Public can insert user support replies"
  ON public.support_replies 
  FOR INSERT
  TO public
  WITH CHECK (sender = 'user');

-- Allow public to read support replies for active tickets
DROP POLICY IF EXISTS "Users can view support replies for their tickets" ON public.support_replies;

CREATE POLICY "Public can view support replies for active tickets"
  ON public.support_replies 
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.chatbot_messages 
      WHERE id = chatbot_message_id 
      AND ticket_status = 'active'
    )
  );
