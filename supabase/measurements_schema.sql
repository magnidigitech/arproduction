-- Final Measurements Table (JSONB-based for maximum flexibility)
CREATE TABLE IF NOT EXISTS public.measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  measurement_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- Safely handle Policy (Allowing both authenticated and anon for development)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.measurements;
CREATE POLICY "Enable all for anyone" ON public.measurements
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Safely handle Trigger
DROP TRIGGER IF EXISTS update_measurements_mod_v3 ON public.measurements;
CREATE TRIGGER update_measurements_mod_v3 
  BEFORE UPDATE ON public.measurements 
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
