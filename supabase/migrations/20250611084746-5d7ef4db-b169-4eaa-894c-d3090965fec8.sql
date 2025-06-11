
-- First, let's see what the current constraint looks like and drop it
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS valid_category;

-- Now create a new constraint that includes "ΝΟΜΟΙ" along with the other categories
ALTER TABLE public.documents ADD CONSTRAINT valid_category 
CHECK (category IN ('ΥΜΣ', 'ΠΙΣΤΟΠΟΙΗΤΙΚΑ', 'ΑΠΟΓΡΑΦΗ', 'ΜΕΤΑΒΟΛΕΣ', 'ΓΝΩΜΟΔΟΤΗΣΕΙΣ Ν.Υ.', 'ΝΟΜΟΙ'));
