'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Save } from 'lucide-react';

interface AddCustomerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export default function AddCustomerForm({ onSuccess, onCancel, initialData }: AddCustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    full_name: '',
    email: '',
    phone: '',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      const { error } = await supabase
        .from('customers')
        .upsert([payload]);

      if (error) throw error;
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Full Name *</label>
        <input
          required
          type="text"
          className="input" // Using a generic global class if available or inline
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Phone Number</label>
        <input
          type="text"
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Email Address</label>
        <input
          type="email"
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Location</label>
        <input
          type="text"
          placeholder="e.g. Mumbai, MH"
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ gap: '0.5rem' }}>
          <Save size={18} /> {loading ? 'Saving...' : 'Save Customer'}
        </button>
      </div>
    </form>
  );
}
