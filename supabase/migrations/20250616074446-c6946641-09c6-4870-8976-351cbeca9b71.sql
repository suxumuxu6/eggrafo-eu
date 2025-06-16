
-- Add file_url column to support_replies table
ALTER TABLE public.support_replies 
ADD COLUMN file_url TEXT;
