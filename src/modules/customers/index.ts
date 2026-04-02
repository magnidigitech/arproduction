import { Registry } from '@/core/ModuleRegistry';
import { supabase } from '@/lib/supabase';

Registry.register({
  id: 'core.customers',
  name: 'Customers',
  description: 'Manage customer profiles, measurements, and preferences.',
  version: '1.0.0',
  isActive: true,
  isAddon: false,
  routes: [
    {
      method: 'GET',
      path: '/customers',
      handler: async (req, res) => {
        const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return Response.json(data);
      }
    },
    {
      method: 'POST',
      path: '/customers',
      handler: async (req, res) => {
        const body = await req.json();
        const { data, error } = await supabase.from('customers').insert(body).select().single();
        if (error) throw error;
        return Response.json(data);
      }
    }
  ]
});
