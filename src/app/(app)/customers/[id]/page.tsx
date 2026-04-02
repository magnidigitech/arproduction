'use client';
import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Calendar, Plus, Ruler, FileText, ShoppingBag, Camera, Loader2, History as HistoryIcon, Edit, Activity, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './profile.module.css';
import MeasurementForm from '@/modules/customers/components/MeasurementForm';
import MeasurementHistory from '@/modules/customers/components/MeasurementHistory';
import MeasurementSheet from '@/modules/customers/components/MeasurementSheet';
import WhatsAppPreviewModal from '@/modules/customers/components/WhatsAppPreviewModal';
import Modal from '@/core/components/Modal';
import AddOrderForm from '@/modules/orders/components/AddOrderForm';
import AddCustomerForm from '@/modules/customers/components/AddCustomerForm';

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [latestMeasurement, setLatestMeasurement] = useState<any>(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [measureRefresh, setMeasureRefresh] = useState(0);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);

  // New features states
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [editRequestData, setEditRequestData] = useState<any>(null);
  const [confirmInput, setConfirmInput] = useState('');

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [customerRes, measurementRes] = await Promise.all([
        supabase
          .from('customers')
          .select(`*, orders(*, outfits(*)), payments(*)`)
          .eq('id', id)
          .single(),
        supabase
          .from('measurements')
          .select('*')
          .eq('customer_id', id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      if (customerRes.error) throw customerRes.error;
      setCustomer(customerRes.data);
      setLatestMeasurement(measurementRes.data);
      if (!selectedMeasurement) {
        setSelectedMeasurement(measurementRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching customer profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditConfirm = () => {
    if (confirmInput.trim().toLowerCase() === 'anusha reddy') {
      setIsEditConfirmOpen(false);
      setConfirmInput('');
      setShowMeasureForm(true);
    } else {
      alert('Verification failed. Please enter the correct name to authorize edit.');
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Customer not found</h2>
        <a href="/customers" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Directory</a>
      </div>
    );
  }

  const initials = customer.full_name.split(' ').map((n: string) => n[0]).join('');

  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarLarge}>{initials}</div>
        <div className={styles.customerMainInfo}>
          <div className={styles.name}>{customer.full_name}</div>
          <div className={styles.type}>{customer.type || 'Standard'}</div>
          <div className={styles.contactStrip}>
            <div className={styles.contactItem}><Phone size={16} /> {customer.phone || 'N/A'}</div>
            <div className={styles.contactItem}><Mail size={16} /> {customer.email || 'N/A'}</div>
            <div className={styles.contactItem}><MapPin size={16} /> {customer.location || 'N/A'}</div>
          </div>
        </div>
        <div className={styles.headerActions} style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" style={{ gap: '0.5rem' }} onClick={() => setIsEditCustomerModalOpen(true)}>
            <Edit size={18} /> Edit Profile
          </button>
          <button className="btn btn-primary" style={{ gap: '0.5rem' }} onClick={() => setIsOrderModalOpen(true)}>
            <Plus size={18} /> New Order
          </button>
        </div>
      </div>

      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title={`Create New Order for ${customer.full_name}`}>
        <AddOrderForm
          customerId={id}
          onSuccess={() => {
            setIsOrderModalOpen(false);
            fetchCustomerData();
          }}
          onCancel={() => setIsOrderModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={isEditCustomerModalOpen} onClose={() => setIsEditCustomerModalOpen(false)} title={`Edit Profile: ${customer.full_name}`}>
        <div style={{ padding: '1rem' }}>
          <AddCustomerForm
            initialData={{
              id: customer.id,
              full_name: customer.full_name,
              email: customer.email,
              phone: customer.phone,
              location: customer.location
            }}
            onSuccess={() => {
              setIsEditCustomerModalOpen(false);
              fetchCustomerData();
            }}
            onCancel={() => setIsEditCustomerModalOpen(false)}
          />
        </div>
      </Modal>

      <div className={styles.tabsBar}>
        <div className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`} onClick={() => setActiveTab('overview')}>Overview</div>
        <div className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`} onClick={() => setActiveTab('orders')}>Orders</div>
        <div className={`${styles.tab} ${activeTab === 'measurements' ? styles.active : ''}`} onClick={() => setActiveTab('measurements')}>Measurements</div>
      </div>

      <div className={styles.contentArea}>
        <div className={styles.mainPanel}>
          {activeTab === 'overview' && (
            <div className={styles.overviewDashboard}>
              {/* Quick Stats Grid */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Orders</div>
                  <div className={styles.statValue}>{customer.orders?.length || 0}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Amount Recieved</div>
                  <div className={styles.statValue} style={{ color: 'var(--success)' }}>
                    ₹{(customer.payments?.reduce((acc: number, p: any) => p.payment_type !== 'refund' ? acc + Number(p.amount) : acc - Number(p.amount), 0) || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Amount</div>
                  <div className={styles.statValue}>
                    ₹{(customer.orders?.reduce((acc: number, o: any) => acc + Number(o.estimated_amount || o.total_amount || 0), 0) || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Joined Date</div>
                  <div className={styles.statValue} style={{ fontSize: '1.25rem' }}>
                    {new Date(customer.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Widgets Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Recent Orders Widget */}
                <div className={styles.card}>
                  <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <div className={styles.cardTitle} style={{ marginBottom: 0 }}>
                      <ShoppingBag size={18} color="var(--primary)" /> Recent Projects
                    </div>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setActiveTab('orders')}>View All</button>
                  </div>

                  {customer.orders?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {customer.orders.slice(0, 3).map((order: any) => {
                        const status = order.status || 'inquiry';
                        const isComplete = ['completed', 'delivered'].includes(status);
                        const statusColor = isComplete ? 'var(--success)' : 'var(--warning)';
                        return (
                          <Link href={`/orders/${order.id}`} key={order.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>{order.order_number || order.display_id}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {order.outfits?.length || 0} Outfits • {order.deadline ? new Date(order.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No deadline'}
                                </div>
                              </div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '1rem', color: statusColor, background: `color-mix(in srgb, ${statusColor} 10%, transparent)` }}>
                                {status.replace(/_/g, ' ').toUpperCase()}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No orders yet.</p>
                  )}
                </div>

                {/* Ledger Widget */}
                <div className={styles.card}>
                  <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <div className={styles.cardTitle} style={{ marginBottom: 0 }}>
                      <Activity size={18} color="var(--primary)" /> Recent Payments
                    </div>
                    <Link href="/payments" className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Ledger</Link>
                  </div>

                  {customer.payments?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {customer.payments.sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()).slice(0, 3).map((payment: any) => (
                        <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem', textTransform: 'capitalize' }}>
                              {payment.payment_method.replace(/_/g, ' ')}
                              <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: 'var(--text-muted)', fontWeight: 400 }}>{payment.payment_type.replace(/_/g, ' ')}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(payment.payment_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </div>
                          </div>
                          <div style={{ fontWeight: 600, color: payment.payment_type === 'refund' ? 'var(--error)' : 'var(--success)' }}>
                            {payment.payment_type === 'refund' ? '-' : '+'}₹{Number(payment.amount).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No payment history.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'measurements' && (
            <>
              {showMeasureForm && (
                <Modal isOpen={showMeasureForm} onClose={() => { setShowMeasureForm(false); setEditRequestData(null); }} title={editRequestData ? "Edit Measurement Record" : "Take New Measurements"}>
                  <MeasurementForm
                    customerId={id}
                    initialData={editRequestData}
                    onSuccess={() => {
                      setShowMeasureForm(false);
                      setEditRequestData(null);
                      setMeasureRefresh(prev => prev + 1);
                      fetchCustomerData();
                    }}
                    onClose={() => { setShowMeasureForm(false); setEditRequestData(null); }}
                  />
                </Modal>
              )}

              {/* Edit Confirmation Modal */}
              <Modal isOpen={isEditConfirmOpen} onClose={() => setIsEditConfirmOpen(false)} title="Authorize Edit">
                <div style={{ padding: '1rem' }}>
                  <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>To edit this measurement record, please type the designer name to confirm identity.</p>
                  <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>AUTHORIZED BY</label>
                    <input
                      type="text"
                      placeholder="Anusha Reddy"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" onClick={() => setIsEditConfirmOpen(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleEditConfirm}>Authorize & Edit</button>
                  </div>
                </div>
              </Modal>

              {/* WhatsApp Preview Modal */}
              <WhatsAppPreviewModal
                isOpen={isWhatsAppOpen}
                onClose={() => setIsWhatsAppOpen(false)}
                measurement={selectedMeasurement}
                customerName={customer?.full_name || customer?.name || 'Customer'}
                customerPhone={customer?.phone}
              />

              <div className={styles.card}>
                <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <div className={styles.cardTitle}>
                    <Ruler size={20} color="var(--primary)" />
                    {selectedMeasurement?.id === latestMeasurement?.id ? 'Most Recent Measurement' : 'Selected Measurement Record'}
                  </div>
                  <button className="btn btn-outline" style={{ gap: '0.5rem' }} onClick={() => setShowMeasureForm(true)}>
                    <Plus size={16} /> Add New
                  </button>
                </div>

                {selectedMeasurement ? (
                  <MeasurementSheet
                    measurement={selectedMeasurement}
                    title="Couture Measurement Sheet"
                    onEdit={(m) => {
                      setEditRequestData(m);
                      setIsEditConfirmOpen(true);
                    }}
                    onShare={() => setIsWhatsAppOpen(true)}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No measurement records found for this customer.</p>
                    <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => setShowMeasureForm(true)}>Take Measurements</button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className={styles.card}>
              <div className={styles.cardTitle}><ShoppingBag size={20} color="var(--primary)" /> Active Orders</div>
              {customer.orders?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {customer.orders.map((order: any) => {
                    const status = order.status || 'inquiry';
                    const isComplete = ['completed', 'delivered'].includes(status);
                    const isProduction = ['pattern_making', 'cutting', 'embroidery', 'stitching', 'trial_1', 'trial_2', 'final_stitching'].includes(status);
                    const StatusIcon = isComplete ? CheckCircle2 : (isProduction ? Activity : FileText);
                    const statusColor = isComplete ? 'var(--success)' : (isProduction ? 'var(--primary)' : 'var(--warning)');
                    const statusBg = isComplete ? 'rgba(46, 125, 50, 0.1)' : (isProduction ? 'rgba(203, 168, 118, 0.1)' : 'rgba(237, 108, 2, 0.1)');
                    const amount = order.estimated_amount || order.total_amount || 0;

                    return (
                      <Link href={`/orders/${order.id}`} key={order.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.05rem' }}>{order.order_number || order.display_id}</span>
                              <span style={{
                                display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 500,
                                padding: '0.2rem 0.6rem', borderRadius: '1rem',
                                color: statusColor, background: statusBg
                              }}>
                                <StatusIcon size={12} />
                                {status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                              {order.outfits?.length > 0 ? (
                                order.outfits.map((outfit: any, index: number) => (
                                  <span key={index} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {outfit.outfit_name || outfit.name}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No outfits added</span>
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <Calendar size={12} />
                              {order.deadline ? new Date(order.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'No deadline'}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No active orders for this customer.</p>
              )}
            </div>
          )}
        </div>

        <div className={styles.sidePanel}>
          <div className={styles.card}>
            <div className={styles.cardTitle}><HistoryIcon size={18} color="var(--primary)" /> Measurement History</div>
            <MeasurementHistory
              customerId={id}
              refreshTrigger={measureRefresh}
              onSelect={(record) => setSelectedMeasurement(record)}
              selectedId={selectedMeasurement?.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
