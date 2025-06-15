
-- Add a 'status' to chatbot_messages: 'unread' (default), 'read'
ALTER TABLE public.chatbot_messages
  ADD COLUMN status text NOT NULL DEFAULT 'unread'; -- 'unread' | 'read'

-- Add a marker for last admin reply and a count of replies in chatbot_messages
ALTER TABLE public.chatbot_messages
  ADD COLUMN last_admin_reply_at timestamptz,
  ADD COLUMN admin_reply_count integer NOT NULL DEFAULT 0;

-- Create a new table for admin replies
CREATE TABLE public.chatbot_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_message_id uuid NOT NULL REFERENCES public.chatbot_messages(id) ON DELETE CASCADE,
  email text NOT NULL,
  subject text NOT NULL,
  body text,
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add RLS policies so only admins can insert, update, delete on chatbot_messages and chatbot_replies
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all chatbot messages"
  ON public.chatbot_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update/delete all chatbot messages"
  ON public.chatbot_messages FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ))
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can insert chatbot replies"
  ON public.chatbot_replies FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can update/delete/select chatbot replies"
  ON public.chatbot_replies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ));

