
-- Create chatbot_messages table to log chatbot conversations and user-submitted info
CREATE TABLE public.chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  messages JSONB NOT NULL, -- array of { sender: 'user' | 'bot', text: string }
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can view, insert, or delete chatbot messages
CREATE POLICY "Admins can view chatbot message logs"
  ON public.chatbot_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert chatbot message logs"
  ON public.chatbot_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete chatbot message logs"
  ON public.chatbot_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
