'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Plus, Trash2 } from 'lucide-react';

interface AddOutfitFormProps {
  orderId: string;
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddOutfitForm({ orderId, initialData, onSuccess, onCancel }: AddOutfitFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    outfit_name: initialData?.outfit_name || '',
    outfit_type: initialData?.outfit_type || 'Lehenga',
    notes: initialData?.notes || '',
  });
  const [components, setComponents] = useState<string[]>(
    initialData?.outfit_components?.map((c: any) => c.component_name) || ['Blouse', 'Skirt']
  );

  const addComponent = () => setComponents([...components, '']);
  const removeComponent = (index: number) => setComponents(components.filter((_, i) => i !== index));
  const updateComponent = (index: number, value: string) => {
    const newComps = [...components];
    newComps[index] = value;
    setComponents(newComps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.outfit_name) return;
    setLoading(true);

    try {
      let outfitId = initialData?.id;

      if (outfitId) {
        // UPDATE existing outfit
        const { error: outfitError } = await supabase
          .from('outfits')
          .update({
            outfit_name: formData.outfit_name,
            outfit_type: formData.outfit_type,
            notes: formData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', outfitId);

        if (outfitError) throw outfitError;

        // Simplified component update: delete old ones and re-insert
        await supabase.from('outfit_components').delete().eq('outfit_id', outfitId);
      } else {
        // INSERT new outfit
        const { data: outfit, error: outfitError } = await supabase
          .from('outfits')
          .insert({
            order_id: orderId,
            outfit_name: formData.outfit_name,
            outfit_type: formData.outfit_type,
            notes: formData.notes
          })
          .select()
          .single();

        if (outfitError) throw outfitError;
        outfitId = outfit.id;
      }

      // 2. Create Components
      const validComponents = components.filter(c => c.trim() !== '');
      if (validComponents.length > 0) {
        const componentInserts = validComponents.map(c => ({
          outfit_id: outfitId,
          component_name: c
        }));

        const { error: compError } = await supabase
          .from('outfit_components')
          .insert(componentInserts);

        if (compError) throw compError;
      }

      // 3. Log to timeline
      await supabase.from('order_timeline').insert({
        order_id: orderId,
        event_type: outfitId ? 'outfit_updated' : 'outfit_added',
        description: `${outfitId ? 'Updated' : 'Added new'} outfit: ${formData.outfit_name}`
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error saving outfit:', error.message);
      alert('Failed to save outfit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Outfit Name</label>
          <input
            required
            type="text"
            placeholder="e.g. Bridal Lehenga"
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            value={formData.outfit_name}
            onChange={(e) => setFormData({ ...formData, outfit_name: e.target.value })}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Outfit Type</label>
          <select
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            value={formData.outfit_type}
            onChange={(e) => setFormData({ ...formData, outfit_type: e.target.value })}
          >
            <option value="Lehenga">Lehenga</option>
            <option value="Saree">Saree</option>
            <option value="Gown">Gown</option>
            <option value="Anarkali">Anarkali</option>
            <option value="Suit">Suit</option>
            <option value="Blazer">Blazer</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
          Components
          <button type="button" onClick={addComponent} style={{ color: 'var(--primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Plus size={14} /> Add Component
          </button>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {components.map((comp, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <input
                type="text"
                value={comp}
                onChange={(e) => updateComponent(index, e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', width: '100px', outline: 'none', color: 'var(--foreground)' }}
              />
              <button type="button" onClick={() => removeComponent(index)} style={{ color: 'var(--error)', display: 'flex', alignItems: 'center' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Notes / Style Details</label>
        <textarea
          rows={3}
          placeholder="Specific embroidery or fabric details..."
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical' }}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ gap: '0.5rem' }}>
          {loading ? 'Saving...' : <><Save size={18} /> {initialData ? 'Update Outfit' : 'Add Outfit'}</>}
        </button>
      </div>
    </form>
  );
}
