-- Fabric and Dyeing Tracking Schema Update

-- 1. Fabric Tracking Table
-- Tracks fabrics needed specifically for an outfit.
CREATE TABLE public.required_fabrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE CASCADE,
  fabric_type TEXT NOT NULL, -- e.g. Raw Silk, Georgette, Net
  color TEXT,
  quantity_required DECIMAL(10, 2), -- e.g. 5.5
  unit TEXT DEFAULT 'meters',
  status TEXT DEFAULT 'to_buy', -- to_buy, bought, in_stock
  cost DECIMAL(10, 2) DEFAULT 0.00,
  bought_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Dyeing Tracking Table
-- Tracks fabrics that need to be sent out for dyeing.
CREATE TABLE public.dyeing_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fabric_id UUID REFERENCES public.required_fabrics(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE CASCADE,
  dyer_name TEXT, -- External dyer or vendor name
  color_reference TEXT, -- e.g. "Match to dupatta Pantone 123"
  status TEXT DEFAULT 'pending', -- pending, at_dyeing, received
  sent_date DATE,
  expected_date DATE,
  received_date DATE,
  cost DECIMAL(10, 2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Modtime triggers
CREATE TRIGGER update_required_fabrics_mod BEFORE UPDATE ON public.required_fabrics FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_dyeing_tasks_mod BEFORE UPDATE ON public.dyeing_tasks FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 4. Disable RLS for prototyping
ALTER TABLE public.required_fabrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dyeing_tasks DISABLE ROW LEVEL SECURITY;
