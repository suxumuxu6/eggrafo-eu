
-- Allow public read access to chatbot_messages for email reply functionality
CREATE POLICY "Public can read chatbot messages for email replies"
  ON public.chatbot_messages
  FOR SELECT
  TO public
  USING (true);
