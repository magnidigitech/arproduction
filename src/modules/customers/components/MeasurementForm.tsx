'use client';
import { useState } from 'react';
import { Ruler, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './measurements.module.css';

interface MeasurementFormProps {
  customerId: string;
  orderId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
  initialData?: any;
}

export default function MeasurementForm({ customerId, orderId, onClose, onSuccess, initialData }: MeasurementFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      const data = initialData.measurement_data || {};
      const notesParts = (initialData.notes || '').split(' | ');
      return {
        customer_id: initialData.customer_id || customerId,
        order_id: data.order_id || initialData.order_id || orderId || null,
        ...data,
        upper_body_remarks: notesParts[0] || '',
        bottom_remarks: notesParts[1] || '',
      };
    }
    return {
      customer_id: customerId,
      order_id: orderId || null,
      shoulders: '',
      upper_bust: '',
      bust_round: '',
      bust_point: '',
      waist: '',
      arm_hole: '',
      biceps_round: '',
      sleeve_length_short: '',
      sleeve_length_elbow: '',
      sleeve_length_long: '',
      hand_round: '',
      yoke_length_front: '',
      yoke_length_back: '',
      cross_front: '',
      cross_back: '',
      upper_body_remarks: '',
      waist_lehenga: '',
      lehenga_length: '',
      anarkali_length: '',
      kurta_length: '',
      full_length: '',
      neck_deep: '',
      hip: '',
      trouser_length: '',
      trouser_waist: '',
      hip_rounding: '',
      thighs_rounding: '',
      knee_rounding: '',
      calf_rounding: '',
      bottom_rounding: '',
      bottom_remarks: '',
    };
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Pack numeric measurements and order_id into measurement_data
      const measurement_data: any = {};
      const fieldsToExclude = ['customer_id', 'order_id', 'upper_body_remarks', 'bottom_remarks'];
      
      Object.keys(formData).forEach(key => {
        if (!fieldsToExclude.includes(key) && formData[key] !== '' && formData[key] !== null) {
          measurement_data[key] = formData[key];
        }
      });

      // Include order_id in the JSONB data instead of a top-level column
      if (orderId) {
        measurement_data.order_id = orderId;
      }

      // Consolidate remarks into 'notes'
      const notes = [formData.upper_body_remarks, formData.bottom_remarks]
        .filter(r => r && r.trim() !== '')
        .join(' | ');

      const payload: any = {
        customer_id: customerId,
        measurement_data,
        notes: notes || null,
        updated_at: new Date().toISOString()
      };

      if (initialData?.id) {
        payload.id = initialData.id;
      }

      const { error } = await supabase
        .from('measurements')
        .upsert([payload]);

      if (error) throw error;
      if (onSuccess) onSuccess();
    } catch (error: any) {
      alert('Error saving measurements: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className={styles.sectionTitle} style={{ color: 'var(--foreground)' }}>
          {initialData ? 'Edit Measurements' : 'New Measurement Record'}
        </h2>
        {onClose && <button type="button" onClick={onClose} className={styles.iconBtn}><X size={20} /></button>}
      </div>

      {/* SECTION 1: Upper Body */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Ruler size={18} />
          <h3 className={styles.sectionTitle}>Upper Body Measurements</h3>
        </div>
        <div className={styles.grid}>
          {[
            { label: 'Shoulders', name: 'shoulders' },
            { label: 'Upper Bust', name: 'upper_bust' },
            { label: 'Bust Round', name: 'bust_round' },
            { label: 'Bust Point', name: 'bust_point' },
            { label: 'Waist', name: 'waist' },
            { label: 'Arm Hole', name: 'arm_hole' },
            { label: 'Biceps Round', name: 'biceps_round' },
          ].map((field) => (
            <div key={field.name} className={styles.inputGroup}>
              <label className={styles.label}>{field.label} <span className={styles.unit}>(cm)</span></label>
              <input 
                type="number" 
                step="0.1" 
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                className={styles.input} 
                placeholder="0.0" 
              />
            </div>
          ))}
        </div>

        <div className={styles.grid} style={{ marginTop: '1rem' }}>
           <div className={styles.inputGroup}>
            <label className={styles.label}>Sleeve (Short)</label>
            <input type="number" name="sleeve_length_short" value={formData.sleeve_length_short || ''} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Sleeve (Elbow)</label>
            <input type="number" name="sleeve_length_elbow" value={formData.sleeve_length_elbow || ''} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Sleeve (Long)</label>
            <input type="number" name="sleeve_length_long" value={formData.sleeve_length_long || ''} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Hand Round</label>
            <input type="number" name="hand_round" value={formData.hand_round || ''} onChange={handleChange} className={styles.input} />
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Yoke Front</label>
            <input type="number" name="yoke_length_front" value={formData.yoke_length_front || ''} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Yoke Back</label>
            <input type="number" name="yoke_length_back" value={formData.yoke_length_back || ''} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Cross Front</label>
            <input type="number" name="cross_front" value={formData.cross_front || ''} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Cross Back</label>
            <input type="number" name="cross_back" value={formData.cross_back || ''} onChange={handleChange} className={styles.input} />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Upper Body Remarks</label>
          <textarea 
            name="upper_body_remarks"
            value={formData.upper_body_remarks || ''}
            onChange={handleChange}
            className={`${styles.input} ${styles.remarksArea}`} 
            placeholder="Add specific notes about fit, padding, etc."
          ></textarea>
        </div>
      </section>

      {/* SECTION 2: Lehenga / Dress */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Ruler size={18} />
          <h3 className={styles.sectionTitle}>Lehenga / Dress Measurements</h3>
        </div>
        <div className={styles.grid}>
          {[
            { label: 'Waist (Lehenga)', name: 'waist_lehenga' },
            { label: 'Lehenga Length', name: 'lehenga_length' },
            { label: 'Anarkali Length', name: 'anarkali_length' },
            { label: 'Kurta Length', name: 'kurta_length' },
            { label: 'Full Length', name: 'full_length' },
            { label: 'Neck Deep', name: 'neck_deep' },
            { label: 'Hip', name: 'hip' },
          ].map((field) => (
            <div key={field.name} className={styles.inputGroup}>
              <label className={styles.label}>{field.label} <span className={styles.unit}>(cm)</span></label>
              <input 
                type="number" 
                step="0.1" 
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                className={styles.input} 
                placeholder="0.0" 
              />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Trouser */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Ruler size={18} />
          <h3 className={styles.sectionTitle}>Trouser Measurements</h3>
        </div>
        <div className={styles.grid}>
          {[
            { label: 'Trouser Length', name: 'trouser_length' },
            { label: 'Trouser Waist', name: 'trouser_waist' },
            { label: 'Hip Rounding', name: 'hip_rounding' },
            { label: 'Thighs Rounding', name: 'thighs_rounding' },
            { label: 'Knee Rounding', name: 'knee_rounding' },
            { label: 'Calf Rounding', name: 'calf_rounding' },
            { label: 'Bottom Rounding', name: 'bottom_rounding' },
          ].map((field) => (
            <div key={field.name} className={styles.inputGroup}>
              <label className={styles.label}>{field.label} <span className={styles.unit}>(cm)</span></label>
              <input 
                type="number" 
                step="0.1" 
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                className={styles.input} 
                placeholder="0.0" 
              />
            </div>
          ))}
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Bottom Remarks</label>
          <textarea 
            name="bottom_remarks"
            value={formData.bottom_remarks || ''}
            onChange={handleChange}
            className={`${styles.input} ${styles.remarksArea}`} 
            placeholder="Notes for trousers/pants fit..."
          ></textarea>
        </div>
      </section>

      <div className={styles.submitBar}>
         <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
         <button type="submit" className="btn btn-primary" disabled={loading} style={{ gap: '0.5rem' }}>
           {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
           {loading ? 'Saving...' : 'Save Measurement'}
         </button>
      </div>
    </form>
  );
}
