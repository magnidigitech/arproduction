'use client';
import { useState, useEffect } from 'react';
import { CreditCard, Search, ArrowUpRight, ArrowDownRight, DollarSign, Filter, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './payments.module.css';
import Link from 'next/link';

export default function PaymentsLedgerPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          orders(order_number),
          customers(full_name, phone)
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error('Error fetching payments:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalCollected = payments.reduce((acc, p) => p.payment_type !== 'refund' ? acc + Number(p.amount) : acc - Number(p.amount), 0);
  const thisMonth = new Date().getMonth();
  const collectedThisMonth = payments
    .filter(p => new Date(p.payment_date).getMonth() === thisMonth)
    .reduce((acc, p) => p.payment_type !== 'refund' ? acc + Number(p.amount) : acc - Number(p.amount), 0);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      (p.orders?.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customers?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.reference_number || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesFilter = filterType === 'all' || p.payment_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Payment Ledger</h1>
        <button className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <ArrowDownRight size={18} /> Export CSV
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Collected (All Time)</span>
          <span className={styles.statValue} style={{ color: 'var(--success)' }}>
            ₹{totalCollected.toLocaleString()}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Collected This Month</span>
          <span className={styles.statValue}>
            ₹{collectedThisMonth.toLocaleString()}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Transactions</span>
          <span className={styles.statValue}>{payments.length}</span>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchBar}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by customer, order, or reference..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none', background: 'var(--background)' }}
          >
            <option value="all">All Types</option>
            <option value="advance">Advance</option>
            <option value="partial">Partial</option>
            <option value="final_settlement">Final Settlement</option>
            <option value="refund">Refunds</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        </div>
      ) : (
        <table className={styles.ledgerTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Project Order</th>
              <th>Type / Method</th>
              <th>Reference</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No payment records found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredPayments.map(payment => (
                <tr key={payment.id}>
                  <td data-label="Date">
                    <div style={{ fontWeight: 500 }}>{new Date(payment.payment_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(payment.created_at).toLocaleTimeString(undefined, { timeStyle: 'short' })}</div>
                  </td>
                  <td data-label="Customer">
                    <Link href={`/customers/${payment.customer_id}`} style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                      {payment.customers?.full_name || 'Unknown'}
                    </Link>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{payment.customers?.phone}</div>
                  </td>
                  <td data-label="Project Order">
                    <Link href={`/orders/${payment.order_id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {payment.orders?.order_number}
                    </Link>
                  </td>
                  <td data-label="Type / Method">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className={styles.badge} style={{ 
                        background: payment.payment_type === 'advance' ? 'var(--primary)' : (payment.payment_type === 'refund' ? 'var(--error)' : 'var(--success)'), 
                        color: 'white' 
                      }}>
                        {payment.payment_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      Via {payment.payment_method.replace(/_/g, ' ')}
                    </div>
                  </td>
                  <td data-label="Reference" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{payment.reference_number || '-'}</td>
                  <td data-label="Amount" style={{ textAlign: 'right' }}>
                    <div className={`${styles.amount} ${payment.payment_type === 'refund' ? styles.amountOut : styles.amountIn}`}>
                      {payment.payment_type === 'refund' ? '- ' : '+ '}₹{Number(payment.amount).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
