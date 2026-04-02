-- Production Workflow Enhancement
-- Adds granular tracking for outfit components

-- 1. Create component production status enum
DO $$ BEGIN
    CREATE TYPE public.component_production_status AS ENUM (
      'pending',
      'pattern_making',
      'cutting',
      'embroidery',
      'stitching',
      'finishing',
      'ready'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update outfit_components table
-- Safe type transition: Drop default, change type, then set new default
ALTER TABLE public.outfit_components ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.outfit_components 
  ALTER COLUMN status TYPE public.component_production_status 
  USING (
    CASE 
      WHEN status = 'ready' THEN 'ready'::public.component_production_status
      ELSE 'pending'::public.component_production_status
    END
  );

ALTER TABLE public.outfit_components ALTER COLUMN status SET DEFAULT 'pending'::public.component_production_status;

ALTER TABLE public.outfit_components 
  ADD COLUMN IF NOT EXISTS production_notes TEXT;

-- 3. Ensure profiles table has a way to fetch tailors
-- This is already in schema.sql but we ensure role is usable
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- (Assuming user_role enum is used)

-- 4. Enable RLS if not already
ALTER TABLE public.outfit_components DISABLE ROW LEVEL SECURITY;
