'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, FileText, Activity, CheckCircle2, Loader2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './orders.module.css';
import Modal from '@/core/components/Modal';
import AddOrderForm from '@/modules/orders/components/AddOrderForm';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [activeTab, setActiveTab] = useState('All Active');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers(full_name, phone),
          outfits(outfit_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, phone')
        .order('full_name', { ascending: true });
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (['completed', 'delivered'].includes(s)) return <CheckCircle2 size={16} />;
    if (['pattern_making', 'cutting', 'embroidery', 'stitching', 'trial_1', 'trial_2', 'final_stitching', 'ready'].includes(s)) return <Activity size={16} />;
    return <FileText size={16} />;
  };

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase().replace(/ /g, '_');
    const mapping: Record<string, string> = {
      inquiry: styles.statusInquiry,
      order_confirmed: styles.statusConfirmed,
      measurements_taken: styles.statusMeasurements,
      design_discussion: styles.statusDiscussion,
      design_approved: styles.statusApproved,
      fabric_selected: styles.statusFabric,
      pattern_making: styles.statusPattern,
      stitching: styles.statusStitching,
      ready: styles.statusReady,
      delivered: styles.statusDelivered,
    };
    return `${styles.statusBadge} ${mapping[s] || styles.statusInquiry}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filterOrders = (orderList: any[]) => {
    return orderList.filter(order => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (order.order_number || '').toLowerCase().includes(query) ||
        (order.customers?.full_name || '').toLowerCase().includes(query) ||
        (order.customers?.phone || '').includes(searchQuery);

      let matchesTab = true;
      const s = (order.status || 'inquiry').toLowerCase().replace(/ /g, '_');
      
      if (activeTab === 'All Active') {
        matchesTab = !['completed', 'delivered', 'cancelled'].includes(s);
      } else if (activeTab === 'In Production') {
        matchesTab = ['pattern_making', 'cutting', 'embroidery', 'stitching', 'trial_1', 'trial_2', 'final_stitching', 'ready', 'fabric_selected'].includes(s);
      } else if (activeTab === 'Design Review') {
        matchesTab = ['inquiry', 'design_discussion', 'design_approved', 'measurements_taken', 'order_confirmed'].includes(s);
      } else if (activeTab === 'Completed') {
        matchesTab = ['completed', 'delivered'].includes(s);
      }

      return matchesSearch && matchesTab;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Orders & Outfits</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Create Order
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search orders by ID, Customer, or Number..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.tabGroup}>
          <button className={`${styles.tabBtn} ${activeTab === 'All Active' ? styles.active : ''}`} onClick={() => setActiveTab('All Active')}>All Active</button>
          <button className={`${styles.tabBtn} ${activeTab === 'In Production' ? styles.active : ''}`} onClick={() => setActiveTab('In Production')}>In Production</button>
          <button className={`${styles.tabBtn} ${activeTab === 'Design Review' ? styles.active : ''}`} onClick={() => setActiveTab('Design Review')}>Design Review</button>
          <button className={`${styles.tabBtn} ${activeTab === 'Completed' ? styles.active : ''}`} onClick={() => setActiveTab('Completed')}>Completed</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 className="animate-spin" size={40} color="var(--primary)" />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading live orders...</p>
        </div>
      ) : (
        <table className={styles.ordersTable}>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Customer</th>
              <th>Outfits</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filterOrders(orders).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  {orders.length === 0 ? 'No active orders found. Click "Create Order" to start a new project.' : 'No matching orders found.'}
                </td>
              </tr>
            ) : (
              filterOrders(orders).map((order) => (
                <tr key={order.id} onClick={() => router.push(`/orders/${order.id}`)} style={{ cursor: 'pointer' }}>
                  <td data-label="Order Number" className={styles.orderId}>{order.order_number}</td>
                  <td data-label="Customer">
                    <div className={styles.customerCell}>
                      <div className={styles.avatar}>
                        {(order.customers?.full_name || order.customers?.name || 'C').split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <span>{order.customers?.full_name || order.customers?.name}</span>
                    </div>
                  </td>
                  <td data-label="Outfits">
                    <div className={styles.outfitsList}>
                      {order.outfits?.length > 0 ? (
                        order.outfits.map((outfit: any, index: number) => (
                          <span key={index} className={styles.outfitBadge}>{outfit.outfit_name}</span>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>No outfits added</span>
                      )}
                    </div>
                  </td>
                  <td data-label="Deadline">{order.deadline ? new Date(order.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}</td>
                  <td data-label="Status">
                    <span className={getStatusClass(order.status || 'inquiry')}>
                      {getStatusIcon(order.status || 'inquiry')}
                      {(order.status || 'inquiry').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  </td>
                  <td data-label="Amount" className={styles.amount}>{formatCurrency(order.estimated_amount || order.total_amount || 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Create Order Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedCustomerId(''); }} 
        title="Launch Professional Production Order"
      >
        <div style={{ padding: '1rem' }}>
          {!selectedCustomerId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Search and select a customer to start the production project.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text"
                    placeholder="Search by name or phone/number..."
                    style={{ padding: '0.75rem', paddingLeft: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', width: '100%', fontSize: '0.9rem' }}
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)' }}>
                  {customers
                    .filter(c => 
                      (c.full_name || '').toLowerCase().includes(customerSearch.toLowerCase()) || 
                      (c.phone || '').includes(customerSearch)
                    )
                    .map(c => (
                      <div 
                        key={c.id} 
                        style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setSelectedCustomerId(c.id)}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                            {c.full_name[0]}
                          </div>
                          <span style={{ fontWeight: 500 }}>{c.full_name}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone}</span>
                      </div>
                    ))}
                  {customers.filter(c => (c.full_name || '').toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone || '').includes(customerSearch)).length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {customers.length === 0 ? 'No customers found in database.' : 'No matching customers found.'}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                 <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                 <User size={18} color="var(--primary)" />
                 <span style={{ fontWeight: 600 }}>Project for: {customers.find(c => c.id === selectedCustomerId)?.full_name}</span>
                 <button 
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                  onClick={() => setSelectedCustomerId('')}
                 >
                   Change
                 </button>
              </div>
              <AddOrderForm 
                customerId={selectedCustomerId}
                onSuccess={() => {
                  setIsModalOpen(false);
                  setSelectedCustomerId('');
                  fetchOrders();
                }}
                onCancel={() => {
                  setIsModalOpen(false);
                  setSelectedCustomerId('');
                }}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
