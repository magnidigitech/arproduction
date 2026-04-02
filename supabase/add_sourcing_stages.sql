-- Add Fabric and Dyeing to the production status ENUM
-- Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction block, 
-- but Supabase SQL editor often allows it if run standalone.

ALTER TYPE public.component_production_status ADD VALUE IF NOT EXISTS 'fabric_sourcing' AFTER 'pending';
ALTER TYPE public.component_production_status ADD VALUE IF NOT EXISTS 'dyeing' AFTER 'fabric_sourcing';
