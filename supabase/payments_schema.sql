-- Payments Module Schema Addition
-- Track advances, partial payments, and final settlements

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

-- Modtime Trigger for payments
CREATE TRIGGER update_payments_mod BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Initially Disable RLS for easier frontend prototyping
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
