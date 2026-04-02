'use client';
import { Ruler, Edit, Share2 } from 'lucide-react';

interface MeasurementSheetProps {
  measurement: any;
  title?: string;
  onEdit?: (measurement: any) => void;
  onShare?: (measurement: any) => void;
}

export default function MeasurementSheet({ measurement, title = "Measurement Sheet", onEdit, onShare }: MeasurementSheetProps) {
  if (!measurement) return (
    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dotted var(--border)' }}>
      <p style={{ color: 'var(--text-muted)' }}>No measurement record selected.</p>
    </div>
  );

  const data = measurement.measurement_data || {};
  const notes = measurement.notes;

  const upperBody = [
    { label: 'Shoulders', key: 'shoulders' },
    { label: 'Upper Bust', key: 'upper_bust' },
    { label: 'Bust Round', key: 'bust_round' },
    { label: 'Bust Point', key: 'bust_point' },
    { label: 'Waist', key: 'waist' },
    { label: 'Arm Hole', key: 'arm_hole' },
    { label: 'Biceps Round', key: 'biceps_round' },
    { label: 'Hand Round', key: 'hand_round' },
  ];

  const lengths = [
    { label: 'Sleeve (Short)', key: 'sleeve_length_short' },
    { label: 'Sleeve (Elbow)', key: 'sleeve_length_elbow' },
    { label: 'Sleeve (Long)', key: 'sleeve_length_long' },
    { label: 'Yoke (Front)', key: 'yoke_length_front' },
    { label: 'Yoke (Back)', key: 'yoke_length_back' },
    { label: 'Cross Front', key: 'cross_front' },
    { label: 'Cross Back', key: 'cross_back' },
  ];

  const bottoms = [
    { label: 'Lehenga Waist', key: 'waist_lehenga' },
    { label: 'Lehenga Length', key: 'lehenga_length' },
    { label: 'Anarkali Length', key: 'anarkali_length' },
    { label: 'Kurta Length', key: 'kurta_length' },
    { label: 'Full Length', key: 'full_length' },
    { label: 'Neck Deep', key: 'neck_deep' },
    { label: 'Hip', key: 'hip' },
    { label: 'Trouser Length', key: 'trouser_length' },
    { label: 'Trouser Waist', key: 'trouser_waist' },
  ];

  const rounding = [
    { label: 'Hip Rounding', key: 'hip_rounding' },
    { label: 'Thighs Rounding', key: 'thighs_rounding' },
    { label: 'Knee Rounding', key: 'knee_rounding' },
    { label: 'Calf Rounding', key: 'calf_rounding' },
    { label: 'Bottom Rounding', key: 'bottom_rounding' },
  ];

  const renderGroup = (groupTitle: string, fields: any[]) => {
    const activeFields = fields.filter(f => data[f.key]);
    if (activeFields.length === 0) return null;

    return (
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {groupTitle}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {activeFields.map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'white', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{f.label}</span>
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>{data[f.key]}<span style={{ fontSize: '0.8rem', marginLeft: '2px', fontWeight: 400 }}>"</span></span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>{title}</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onEdit && (
              <button 
                onClick={() => onEdit(measurement)}
                className="btn btn-outline" 
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', gap: '0.4rem', borderRadius: '20px' }}
              >
                <Edit size={14} /> Edit Record
              </button>
            )}
            {onShare && (
              <button 
                onClick={() => onShare(measurement)}
                className="btn btn-outline" 
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', gap: '0.4rem', color: '#25D366', borderColor: '#25D366', borderRadius: '20px' }}
              >
                <Share2 size={14} /> Share WhatsApp
              </button>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time Taken</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
            {new Date(measurement.updated_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {new Date(measurement.updated_at).toLocaleTimeString(undefined, { timeStyle: 'short' })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {renderGroup('Upper Body Measurements', upperBody)}
        {renderGroup('Sleeves & Lengths', lengths)}
        {renderGroup('Bottoms & Special Lengths', bottoms)}
        {renderGroup('Rounding Details', rounding)}

        {notes && (
          <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', borderLeft: '4px solid var(--primary)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Special Remarks & Notes
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', lineHeight: '1.6', margin: 0 }}>{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
