'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Ruler, Check, Loader2 } from 'lucide-react';

interface LinkMeasurementFormProps {
  orderId: string;
  customerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LinkMeasurementForm({ orderId, customerId, onSuccess, onCancel }: LinkMeasurementFormProps) {
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchMeasurements() {
      try {
        const { data, error } = await supabase
          .from('measurements')
          .select('*')
          .eq('customer_id', customerId)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setMeasurements(data || []);
      } catch (error: any) {
        console.error('Error fetching measurements:', error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMeasurements();
  }, [customerId]);

  const handleLink = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('order_measurements')
        .insert({
          order_id: orderId,
          measurement_id: selectedId
        });

      if (error) throw error;

      // Add to timeline
      await supabase.from('order_timeline').insert({
        order_id: orderId,
        event_type: 'measurement_linked',
        description: 'Linked a measurement record to the project'
      });

      onSuccess();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" color="var(--primary)" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Select a measurement record from the customer's history to link to this project.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
        {measurements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No measurements found for this customer.</p>
          </div>
        ) : (
          measurements.map((m) => (
            <div 
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                borderColor: selectedId === m.id ? 'var(--primary)' : 'var(--border)',
                background: selectedId === m.id ? 'var(--primary-light)' : 'var(--surface)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
            >
              <div>
                <span style={{ fontWeight: 600, display: 'block', color: 'var(--foreground)' }}>
                  Record from {new Date(m.updated_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {m.notes ? m.notes.substring(0, 60) + (m.notes.length > 60 ? '...' : '') : 'No remarks provided'}
                </span>
              </div>
              {selectedId === m.id && <Check size={20} color="var(--primary)" />}
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button 
          type="button"
          className="btn btn-primary" 
          onClick={handleLink} 
          disabled={!selectedId || saving}
          style={{ gap: '0.5rem' }}
        >
          {saving ? 'Linking...' : <><Ruler size={18} /> Link Record</>}
        </button>
      </div>
    </div>
  );
}
