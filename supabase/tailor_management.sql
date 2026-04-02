-- 1. Create Internal Team table
CREATE TABLE public.internal_team (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'tailor',
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_internal_team_mod BEFORE UPDATE ON public.internal_team FOR EACH ROW EXECUTE FUNCTION update_modified_column();
ALTER TABLE public.internal_team DISABLE ROW LEVEL SECURITY;

-- 2. Modify outfit_components to point to the new table
ALTER TABLE public.outfit_components DROP CONSTRAINT IF EXISTS outfit_components_assigned_tailor_fkey;

-- Since the current column has UUIDs from auth.users, and we are switching to a new table,
-- any existing assigned_tailor UUIDs will violate the new constraint unless we migrate them or clear them.
-- For safety during this transition (since tailors were barely assignable anyway), we will clear the column.
UPDATE public.outfit_components SET assigned_tailor = NULL;

ALTER TABLE public.outfit_components 
  ADD CONSTRAINT outfit_components_assigned_tailor_fkey 
  FOREIGN KEY (assigned_tailor) 
  REFERENCES public.internal_team(id) 
  ON DELETE SET NULL;
