
-- Add support ticket fields to chatbot_messages table
ALTER TABLE public.chatbot_messages 
ADD COLUMN support_ticket_code text,
ADD COLUMN ticket_status text DEFAULT 'active' CHECK (ticket_status IN ('active', 'closed')),
ADD COLUMN closed_at timestamptz;

-- Create support_replies table for user replies from support page
CREATE TABLE public.support_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_message_id uuid NOT NULL REFERENCES public.chatbot_messages(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user', 'admin')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on support_replies
ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;

-- Create policy for support replies - users can view replies for tickets they have access to
CREATE POLICY "Users can view support replies for their tickets"
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

-- Create policy for users to insert their own replies
CREATE POLICY "Users can insert their own support replies"
  ON public.support_replies 
  FOR INSERT
  TO public
  WITH CHECK (sender = 'user');

-- Create policy for admins to view all support replies
CREATE POLICY "Admins can view all support replies"
  ON public.support_replies 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy for admins to insert admin replies
CREATE POLICY "Admins can insert admin support replies"
  ON public.support_replies 
  FOR INSERT
  WITH CHECK (
    sender = 'admin' AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX idx_support_replies_chatbot_message_id ON public.support_replies(chatbot_message_id);
CREATE INDEX idx_chatbot_messages_ticket_code ON public.chatbot_messages(support_ticket_code);
