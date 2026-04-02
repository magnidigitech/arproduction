-- Custom Types
CREATE TYPE user_role AS ENUM ('admin', 'designer', 'tailor', 'manager');
CREATE TYPE order_status AS ENUM ('inquiry', 'design_review', 'production', 'ready_for_trial', 'completed', 'cancelled');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- 1. Profiles (extends auth.users from Supabase)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role user_role DEFAULT 'tailor',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customers
CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customer Measurements (JSONB)
CREATE TABLE public.measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  measurement_data JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id TEXT UNIQUE NOT NULL, -- e.g. ORD-2024-001
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  status order_status DEFAULT 'inquiry',
  total_amount DECIMAL(12, 2) DEFAULT 0.00,
  advance_paid DECIMAL(12, 2) DEFAULT 0.00,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Outfits (Order Items)
CREATE TABLE public.outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. Bridal Lehenga
  description TEXT,
  priority priority_level DEFAULT 'medium',
  status TEXT DEFAULT 'pending', 
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Production Stages (Kanban Columns)
CREATE TABLE public.production_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  description TEXT
);

-- Insert default stages
INSERT INTO public.production_stages (name, order_index) VALUES 
  ('Pattern Making', 1),
  ('Cutting', 2),
  ('Embroidery', 3),
  ('Stitching', 4),
  ('Finishing', 5);

-- 7. Production Tasks (Kanban Cards)
CREATE TABLE public.production_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.production_stages(id) ON DELETE RESTRICT,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'todo', -- todo, in_progress, done
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Materials / Inventory Add-on
CREATE TABLE public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  stock_quantity DECIMAL(10, 2) DEFAULT 0.00,
  unit TEXT DEFAULT 'meters', 
  reorder_level DECIMAL(10, 2) DEFAULT 10.00,
  supplier TEXT,
  unit_cost DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Design Files & Attachments
CREATE TABLE public.design_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'order', 'outfit', 'customer'
  entity_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT, -- 'sketch', 'reference', 'fabric'
  title TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modtime Triggers
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_mod BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_customers_mod BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_measurements_mod BEFORE UPDATE ON public.measurements FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_orders_mod BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_outfits_mod BEFORE UPDATE ON public.outfits FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_tasks_mod BEFORE UPDATE ON public.production_tasks FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_materials_mod BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Initially Disable RLS for easier frontend prototyping
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_files DISABLE ROW LEVEL SECURITY;

-- 10. Payments Module Table
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'upi', 'bank_transfer', 'cheque');
CREATE TYPE public.payment_type AS ENUM ('advance', 'partial', 'final_settlement', 'refund');

CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method public.payment_method DEFAULT 'cash',
  payment_type public.payment_type DEFAULT 'partial',
  reference_number TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_payments_mod BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_modified_column();
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
