
-- Add view_count column to documents table
ALTER TABLE public.documents 
ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

-- Create an index on view_count for better performance when sorting by popularity
CREATE INDEX idx_documents_view_count ON public.documents(view_count DESC);

-- Create a function to increment view count
CREATE OR REPLACE FUNCTION increment_document_views(document_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.documents 
  SET view_count = view_count + 1 
  WHERE id = document_id;
END;
$$;
