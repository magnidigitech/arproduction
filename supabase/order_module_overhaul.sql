-- 1. Drop existing order-related tables if necessary to start fresh with new architecture
-- Caution: This deletes existing data in these tables.
DROP TABLE IF EXISTS public.order_payments CASCADE;
DROP TABLE IF EXISTS public.order_timeline CASCADE;
DROP TABLE IF EXISTS public.order_measurements CASCADE;
DROP TABLE IF EXISTS public.outfit_components CASCADE;
DROP TABLE IF EXISTS public.outfits CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- 2. Create refined Order Status enum
-- Note: 'order_status' might already exist, so we drop and recreate if preferred or just use new values.
-- For safety in this script, we assume a fresh start for the order module.
DROP TYPE IF EXISTS public.order_status CASCADE;
CREATE TYPE public.order_status AS ENUM (
  'inquiry',
  'order_confirmed',
  'measurements_taken',
  'design_discussion',
  'design_approved',
  'fabric_selected',
  'pattern_making',
  'cutting',
  'embroidery',
  'stitching',
  'trial_1',
  'alterations',
  'trial_2',
  'final_stitching',
  'quality_check',
  'ready',
  'delivered',
  'completed',
  'cancelled'
);

-- 3. Orders Table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL, -- e.g. ARC-2026-0001
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  status public.order_status DEFAULT 'inquiry',
  order_type TEXT, -- e.g. Bridal, Occasion, Casual
  event_type TEXT, -- e.g. Wedding, Reception, Sangeet
  event_date DATE,
  deadline DATE,
  estimated_amount DECIMAL(12, 2) DEFAULT 0.00,
  final_amount DECIMAL(12, 2) DEFAULT 0.00,
  priority TEXT DEFAULT 'medium', -- low, medium, high
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Outfits Table
CREATE TABLE public.outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  outfit_name TEXT NOT NULL, -- e.g. Bridal Lehenga
  outfit_type TEXT, -- e.g. Lehenga, Gown, Anarkali
  designer_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Outfit Components Table
CREATE TABLE public.outfit_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL, -- e.g. Blouse, Skirt, Dupatta
  status TEXT DEFAULT 'pending',
  assigned_tailor UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Measurement Linking Table
CREATE TABLE public.order_measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  measurement_id UUID REFERENCES public.measurements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Order Timeline Table
CREATE TABLE public.order_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g. status_change, payment, trial
  description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Order Payments Table
CREATE TABLE public.order_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL, -- advance, partial, final
  amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT, -- cash, upi, card, bank_transfer
  transaction_reference TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Order Number Generation Logic (ARC-YYYY-XXXX)
-- We'll use a sequence if needed, but a simple trigger + count is often easier for this format.
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    seq_val TEXT;
BEGIN
    year_prefix := to_char(NOW(), 'YYYY');
    seq_val := lpad(nextval('order_number_seq')::text, 4, '0');
    NEW.order_number := 'ARC-' || year_prefix || '-' || seq_val;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION generate_order_number();

-- 10. Auto-modtime triggers
CREATE TRIGGER update_order_modtime BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_outfit_modtime BEFORE UPDATE ON public.outfits FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_outfit_comp_modtime BEFORE UPDATE ON public.outfit_components FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 11. Disable RLS for development (as per current schema preference)
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_components DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_measurements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments DISABLE ROW LEVEL SECURITY;
