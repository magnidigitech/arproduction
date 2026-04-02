-- Settings Module Schema Update

CREATE TYPE public.vendor_type AS ENUM ('fabric', 'dyeing', 'other');

-- 1. Vendors Table (Fabric Suppliers, Dyers, etc.)
CREATE TABLE public.vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- Company or shop name
  type public.vendor_type DEFAULT 'other',
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modtime Trigger
CREATE TRIGGER update_vendors_mod BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Initially Disable RLS for easier frontend prototyping
ALTER TABLE public.vendors DISABLE ROW LEVEL SECURITY;
