CREATE TABLE public.workshop_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  partner TEXT NOT NULL,
  car_summary TEXT NOT NULL DEFAULT '',
  verdict TEXT NOT NULL DEFAULT '',
  headline TEXT NOT NULL DEFAULT '',
  symptom TEXT NOT NULL DEFAULT '',
  estimated_cost TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.workshop_leads TO authenticated;
GRANT ALL ON public.workshop_leads TO service_role;
ALTER TABLE public.workshop_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own workshop leads"
ON public.workshop_leads FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create their own workshop leads"
ON public.workshop_leads FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND consent = true);