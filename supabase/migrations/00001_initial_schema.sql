-- ==============================================================================
-- Couture ERP - Initial Database Schema
-- Built for Supabase (PostgreSQL)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. UTILITY & CORE (Types, Functions)
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 2. TEAM & SYSTEM USERS MODULE
-- ==============================================================================
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL, -- e.g., 'Admin', 'Designer', 'Tailor', 'Embroidery Artisan', 'Quality Control'
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid REFERENCES auth.users(id), -- links to Supabase Auth
  role_id uuid REFERENCES roles(id),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL, -- e.g., 'Zardosi', 'Pattern Cutting'
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE artisan_skills (
  artisan_id uuid REFERENCES team_members(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level int DEFAULT 1, -- 1-5
  PRIMARY KEY (artisan_id, skill_id)
);

-- ==============================================================================
-- 3. CUSTOMER MODULE
-- ==============================================================================
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE customer_addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'Billing', 'Shipping'
  street1 text NOT NULL,
  street2 text,
  city text NOT NULL,
  state text,
  postal_code text,
  country text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE customer_measurements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  measured_by uuid REFERENCES team_members(id),
  metrics jsonb NOT NULL, -- e.g. {"bust": 34, "waist": 28 ... }
  notes text,
  measured_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE customer_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL, -- style choices, allergens
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE customer_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  author_id uuid REFERENCES team_members(id),
  note text NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

-- ==============================================================================
-- 4. ORDER MODULE 
-- ==============================================================================
CREATE TABLE order_status (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL, -- 'Inquiry', 'Confirmed', 'Design Approved', 'Delivered'
  sort_order int NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE RESTRICT,
  status_id uuid REFERENCES order_status(id),
  sales_rep_id uuid REFERENCES team_members(id),
  expected_delivery_date date,
  total_amount numeric(12,2) DEFAULT 0.00,
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE order_timeline (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  status_id uuid REFERENCES order_status(id),
  recorded_by uuid REFERENCES team_members(id),
  remarks text,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE order_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES team_members(id),
  created_at timestamptz DEFAULT NOW()
);

-- ==============================================================================
-- 5. OUTFIT MODULE
-- ==============================================================================
CREATE TABLE outfits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g., 'Bridal Lehenga Set'
  description text,
  quantity int DEFAULT 1,
  price numeric(12,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE outfit_components (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  outfit_id uuid REFERENCES outfits(id) ON DELETE CASCADE,
  component_type text NOT NULL, -- 'Blouse', 'Skirt', 'Dupatta'
  description text,
  measurements_snapshot jsonb, -- The measurements locked in for this specific component
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- ==============================================================================
-- 6. DESIGN MODULE
-- ==============================================================================
CREATE TABLE design_projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  lead_designer_id uuid REFERENCES team_members(id),
  status text DEFAULT 'Draft', -- 'Draft', 'Review', 'Approved'
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE design_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES design_projects(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  title text NOT NULL,
  description text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE design_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id uuid REFERENCES design_versions(id) ON DELETE CASCADE,
  component_id uuid REFERENCES outfit_components(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  asset_type text NOT NULL, -- 'Sketch', 'Fabric Ref', 'Embroidery Pattern'
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE design_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id uuid REFERENCES design_assets(id) ON DELETE CASCADE,
  author_id uuid REFERENCES team_members(id),
  comment text NOT NULL,
  x_coordinate numeric, -- for pinning comments on images
  y_coordinate numeric,
  created_at timestamptz DEFAULT NOW()
);

-- ==============================================================================
-- 7. PRODUCTION MODULE (Kanban/Tracking)
-- ==============================================================================
CREATE TABLE production_stages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL, -- 'Pattern', 'Cutting', 'Embroidery', 'Stitching', 'Finishing'
  sort_order int NOT NULL,
  color_code text,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE production_tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  component_id uuid REFERENCES outfit_components(id) ON DELETE CASCADE,
  current_stage_id uuid REFERENCES production_stages(id),
  status text DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed', 'Blocked'
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE production_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_id uuid REFERENCES production_tracking(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES team_members(id),
  stage_id uuid REFERENCES production_stages(id),
  deadline timestamptz,
  priority text DEFAULT 'Normal',
  instructions text,
  status text DEFAULT 'To Do',
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE work_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid REFERENCES production_tasks(id) ON DELETE CASCADE,
  artisan_id uuid REFERENCES team_members(id),
  hours_logged numeric(5,2) NOT NULL,
  log_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE production_issues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_id uuid REFERENCES production_tracking(id) ON DELETE CASCADE,
  reported_by uuid REFERENCES team_members(id),
  issue_description text NOT NULL,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- ==============================================================================
-- 8. TRIALS & ALTERATIONS MODULE
-- ==============================================================================
CREATE TABLE trials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  trial_number int DEFAULT 1,
  conducted_by uuid REFERENCES team_members(id),
  status text DEFAULT 'Scheduled',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE trial_feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trial_id uuid REFERENCES trials(id) ON DELETE CASCADE,
  component_id uuid REFERENCES outfit_components(id) ON DELETE CASCADE,
  feedback text NOT NULL,
  required_alteration boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE trial_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trial_id uuid REFERENCES trials(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE alterations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id uuid REFERENCES trial_feedback(id) ON DELETE CASCADE,
  description text NOT NULL,
  status text DEFAULT 'Pending',
  assigned_to uuid REFERENCES team_members(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- ==============================================================================
-- 9. INVENTORY & MATERIALS MODULE
-- ==============================================================================
CREATE TABLE material_suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  contact_info text,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL, -- 'Fabric', 'Thread', 'Bead', 'Embellishment'
  unit_of_measure text NOT NULL, -- 'meters', 'yards', 'spools', 'kg'
  supplier_id uuid REFERENCES material_suppliers(id),
  cost_per_unit numeric(10,2),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE material_stock (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  quantity_available numeric(10,2) DEFAULT 0,
  reorder_level numeric(10,2) DEFAULT 0,
  location text,
  last_counted_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE component_materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  component_id uuid REFERENCES outfit_components(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id),
  estimated_quantity numeric(10,2),
  actual_quantity_used numeric(10,2),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- ==============================================================================
-- 10. FINANCE & PAYMENTS MODULE
-- ==============================================================================
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  tax numeric(12,2) DEFAULT 0.00,
  discount numeric(12,2) DEFAULT 0.00,
  total_amount numeric(12,2) NOT NULL,
  status text DEFAULT 'Unpaid', -- 'Unpaid', 'Partial', 'Paid'
  due_date date,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE payment_methods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL, -- 'Cash', 'Credit Card', 'Bank Transfer'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  payment_method_id uuid REFERENCES payment_methods(id),
  transaction_ref text,
  payment_date timestamptz DEFAULT NOW(),
  recorded_by uuid REFERENCES team_members(id),
  created_at timestamptz DEFAULT NOW()
);

-- ==============================================================================
-- 11. DELIVERY MODULE
-- ==============================================================================
CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  shipping_address_id uuid REFERENCES customer_addresses(id),
  tracking_number text,
  courier_name text,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Example Basic RLS setup for an ERP
-- For production, these would be locked down based on auth.users() and team_members

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated team members (pseudo-policy for now)
CREATE POLICY "Enable read for authenticated users" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read for authenticated users" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON orders FOR ALL TO authenticated USING (true);

-- Adding trigger to updated_at cols for a few critical tables
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_outfits_updated_at BEFORE UPDATE ON outfits FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_production_tracking_updated_at BEFORE UPDATE ON production_tracking FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
