'use client';
import { useState, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import Modal from '@/core/components/Modal';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  measurement: any;
  customerName: string;
  customerPhone?: string;
}

export default function WhatsAppPreviewModal({ isOpen, onClose, measurement, customerName, customerPhone }: WhatsAppPreviewModalProps) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (measurement) {
      const data = measurement.measurement_data || {};
      const notes = measurement.notes;
      
      let msg = `*Measurement Sheet - Anusha Reddy Couture*\n`;
      msg += `*Customer:* ${customerName}\n`;
      msg += `*Date:* ${new Date(measurement.updated_at).toLocaleString()}\n\n`;

      const groups = [
        { title: "Upper Body", fields: ['shoulders', 'upper_bust', 'bust_round', 'bust_point', 'waist', 'arm_hole', 'biceps_round', 'hand_round'] },
        { title: "Sleeves/Cross", fields: ['sleeve_length_short', 'sleeve_length_elbow', 'sleeve_length_long', 'yoke_length_front', 'yoke_length_back', 'cross_front', 'cross_back'] },
        { title: "Bottoms", fields: ['waist_lehenga', 'lehenga_length', 'anarkali_length', 'kurta_length', 'full_length', 'neck_deep', 'hip', 'trouser_length', 'trouser_waist'] },
        { title: "Rounding", fields: ['hip_rounding', 'thighs_rounding', 'knee_rounding', 'calf_rounding', 'bottom_rounding'] }
      ];

      groups.forEach(group => {
        let groupText = '';
        group.fields.forEach(field => {
          if (data[field]) {
            // Convert field_name to display name
            const label = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            groupText += `• ${label}: ${data[field]}"\n`;
          }
        });
        if (groupText) {
          msg += `*${group.title}*\n${groupText}\n`;
        }
      });

      if (notes) {
        msg += `*Remarks:*\n${notes}`;
      }

      setMessage(msg);
    }
  }, [measurement, customerName]);

  const handleSend = () => {
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = customerPhone ? customerPhone.replace(/\D/g, '') : '';
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}/?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="WhatsApp Message Preview">
      <div style={{ padding: '0.5rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Review the message below before sharing. Empty measurement fields have been automatically filtered out.
        </p>
        
        <textarea 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: '100%',
            height: '300px',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'var(--background)',
            color: 'var(--foreground)',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            resize: 'none'
          }}
        />

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSend} style={{ gap: '0.5rem' }}>
            <Send size={18} /> Send to WhatsApp
          </button>
        </div>
      </div>
    </Modal>
  );
}
