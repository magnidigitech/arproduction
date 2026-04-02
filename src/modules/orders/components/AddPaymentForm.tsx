'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface AddPaymentFormProps {
  orderId: string;
  customerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddPaymentForm({ orderId, customerId, onSuccess, onCancel }: AddPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash',
    payment_type: 'partial',
    reference_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.amount || isNaN(parseFloat(formData.amount))) {
        throw new Error('Please enter a valid amount.');
      }

      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from('payments').insert({
        order_id: orderId,
        customer_id: customerId,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_type: formData.payment_type,
        reference_number: formData.reference_number,
        payment_date: formData.payment_date,
        notes: formData.notes,
        recorded_by: userData?.user?.id || null
      });

      if (error) throw error;

      // Update order's advance_paid for legacy tracking if needed
      if (formData.payment_type === 'advance') {
        const { data: orderData } = await supabase.from('orders').select('advance_paid').eq('id', orderId).single();
        const currentAdv = parseFloat(orderData?.advance_paid || 0);
        await supabase.from('orders').update({ advance_paid: currentAdv + parseFloat(formData.amount) }).eq('id', orderId);
      }

      // Log in timeline
      await supabase.from('order_timeline').insert({
        order_id: orderId,
        event_type: 'payment_received',
        description: `Received ${formData.payment_type.replace(/_/g, ' ')} payment of ₹${formData.amount} via ${formData.payment_method}`
      });

      onSuccess();
    } catch (error: any) {
      alert(error.message || 'Error saving payment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Payment Amount (₹) *</label>
          <input 
            type="number" 
            required
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Date *</label>
          <input 
            type="date" 
            required
            value={formData.payment_date}
            onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Payment Type</label>
          <select 
            value={formData.payment_type}
            onChange={(e) => setFormData({...formData, payment_type: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none', background: 'var(--background)' }}
          >
            <option value="advance">Advance</option>
            <option value="partial">Partial</option>
            <option value="final_settlement">Final Settlement</option>
            <option value="refund">Refund</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Payment Method</label>
          <select 
            value={formData.payment_method}
            onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none', background: 'var(--background)' }}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Reference / Transaction Number</label>
        <input 
          type="text" 
          value={formData.reference_number}
          onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
          placeholder="e.g. UPI Ref ID, Cheque No"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Internal Notes</label>
        <textarea 
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Any additional details..."
          rows={3}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none', resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '120px' }}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Payment'}
        </button>
      </div>
    </form>
  );
}
