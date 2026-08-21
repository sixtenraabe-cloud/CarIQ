ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS variant text,
  ADD COLUMN IF NOT EXISTS last_inspection date,
  ADD COLUMN IF NOT EXISTS oil_change_date date,
  ADD COLUMN IF NOT EXISTS oil_change_km integer;

CREATE UNIQUE INDEX IF NOT EXISTS cars_one_per_user ON public.cars (user_id);