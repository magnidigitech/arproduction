'use client';
import { useState, useEffect, useCallback } from 'react';
import { History, Calendar, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './measurements.module.css';


interface MeasurementHistoryProps {
  customerId: string;
  refreshTrigger?: number; // Used to trigger refresh from parent
  onSelect?: (record: any) => void;
  selectedId?: string;
}

export default function MeasurementHistory({ customerId, refreshTrigger, onSelect, selectedId }: MeasurementHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('measurements')
        .select(`*`)
        .eq('customer_id', customerId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching measurement history:', error.message);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Loader2 className="animate-spin" size={24} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className={styles.historyList}>
      <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', color: 'var(--foreground)', marginBottom: '1.5rem' }}>
        <History size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
        Measurement Timeline
      </h3>

      {history.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
          No measurement records yet.
        </p>
      ) : (
        history.map((record) => (
          <div 
            key={record.id} 
            className={`${styles.timelineItem} ${selectedId === record.id ? styles.selected : ''}`}
            onClick={() => onSelect && onSelect(record)}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
          >
            <div className={styles.timelineDot}></div>
            <div className={`${styles.historyCard} ${selectedId === record.id ? styles.cardSelected : ''}`}>
              <div className={styles.historyHeader}>
                <span className={styles.historyDate}>{new Date(record.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className={styles.historyType}>
                  {record.measurement_data?.order_id || 'GENERAL'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {record.notes ? record.notes.substring(0, 50) + (record.notes.length > 50 ? '...' : '') : 'No remarks provided.'}
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                 {record.measurement_data?.shoulders && (
                   <span style={{ fontSize: '0.7rem', background: 'var(--border)', padding: '2px 6px', borderRadius: '4px' }}>Sh: {record.measurement_data.shoulders}"</span>
                 )}
                 {record.measurement_data?.bust_round && (
                   <span style={{ fontSize: '0.7rem', background: 'var(--border)', padding: '2px 6px', borderRadius: '4px' }}>Bust: {record.measurement_data.bust_round}"</span>
                 )}
                 {record.measurement_data?.waist && (
                   <span style={{ fontSize: '0.7rem', background: 'var(--border)', padding: '2px 6px', borderRadius: '4px' }}>Waist: {record.measurement_data.waist}"</span>
                 )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
