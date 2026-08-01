ALTER TABLE public.diagnoses ALTER COLUMN verdict TYPE text USING verdict::text;
DROP TYPE IF EXISTS public.drive_verdict;
ALTER TABLE public.diagnoses ADD CONSTRAINT diagnoses_verdict_check CHECK (verdict IN ('safe','caution','soon','urgent'));