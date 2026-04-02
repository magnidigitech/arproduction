'use client';
import { useState, useEffect, use } from 'react';
import { 
  ChevronLeft, Calendar, Clock, IndianRupee, Tag, 
  ShoppingBag, Ruler, Activity, CreditCard, History, 
  Plus, Edit, Trash2, CheckCircle2, AlertCircle, Loader2, Scissors
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '../order-detail.module.css';
import Link from 'next/link';
import Modal from '@/core/components/Modal';
import AddOutfitForm from '@/modules/orders/components/AddOutfitForm';
import LinkMeasurementForm from '@/modules/orders/components/LinkMeasurementForm';
import AddPaymentForm from '@/modules/orders/components/AddPaymentForm';
import FabricAndDyeingTab from '@/modules/orders/components/FabricAndDyeingTab';

interface OrderDetailProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailProps) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [statusLoading, setStatusLoading] = useState(false);
  const [isOutfitModalOpen, setIsOutfitModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState<any>(null);
  const [deletingOutfitId, setDeletingOutfitId] = useState<string | null>(null);
  const [tailors, setTailors] = useState<any[]>([]);
  const [compLoading, setCompLoading] = useState<string | null>(null);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*),
          outfits(*, outfit_components(*)),
          payments(*),
          order_timeline(*),
          order_measurements(*, measurements(*))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);

      // Fetch tailors if not already fetched
      if (tailors.length === 0) {
        const { data: profiles } = await supabase
          .from('internal_team')
          .select('*')
          .in('role', ['tailor', 'master_cutter']);
        setTailors(profiles || []);
      }
    } catch (error: any) {
      console.error('Error fetching order:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Add to timeline
      await supabase.from('order_timeline').insert({
        order_id: id,
        event_type: 'status_change',
        description: `Order status updated to ${newStatus.replace(/_/g, ' ')}`
      });

      await fetchOrderDetails();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setStatusLoading(false);
    }
  };

  const deleteOutfit = async () => {
    if (!deletingOutfitId) return;
    try {
      const { error } = await supabase.from('outfits').delete().eq('id', deletingOutfitId);
      if (error) throw error;
      
      await supabase.from('order_timeline').insert({
        order_id: id,
        event_type: 'outfit_deleted',
        description: 'Removed an outfit from the project'
      });

      await fetchOrderDetails();
      setDeletingOutfitId(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEditClick = (outfit: any) => {
    setEditingOutfit(outfit);
    setIsOutfitModalOpen(true);
  };

  const handleAddQuickComponent = async (outfitId: string) => {
    const name = prompt('Enter component name (e.g., Belt, Dupatta):');
    if (!name) return;

    try {
      const { error } = await supabase.from('outfit_components').insert({
        outfit_id: outfitId,
        component_name: name
      });
      if (error) throw error;
      await fetchOrderDetails();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const unlinkMeasurement = async (linkId: string) => {
    if (!confirm('Are you sure you want to unlink this measurement record?')) return;
    try {
      const { error } = await supabase.from('order_measurements').delete().eq('id', linkId);
      if (error) throw error;
      await fetchOrderDetails();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const updateComponentProduction = async (compId: string, updates: any, outfitName: string, componentName: string) => {
    setCompLoading(compId);
    try {
      const { error } = await supabase
        .from('outfit_components')
        .update(updates)
        .eq('id', compId);

      if (error) throw error;
      
      // Detailed timeline logging
      if (updates.status || updates.assigned_tailor !== undefined) {
         let description = `${outfitName} - ${componentName}`;
         
         if (updates.status) {
           description += ` updated to ${updates.status.replace(/_/g, ' ')}`;
         } else if (updates.assigned_tailor) {
           const tailorName = tailors.find(t => t.id === updates.assigned_tailor)?.full_name || 'Tailor';
           description += ` assigned to ${tailorName}`;
         } else {
           description += ` unassigned`;
         }

         await supabase.from('order_timeline').insert({
           order_id: id,
           event_type: 'production_update',
           description: description
         });
      }

      await fetchOrderDetails();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCompLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading production project...</p>
      </div>
    );
  }

  if (!order) return <div className="card">Order not found.</div>;

  return (
    <div className={styles.container}>
      <Link href="/orders" className={styles.backBtn}>
        <ChevronLeft size={18} /> Back to Projects
      </Link>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.orderBadge}>PROJECT PROJECT</span>
          <h1 className={styles.orderTitle}>{order.order_number}</h1>
          <Link href={`/customers/${order.customer_id}`} className={styles.customerLink}>
            <span style={{ fontSize: '1.2rem' }}>{order.customers?.full_name}</span>
          </Link>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
             <div className={styles.statusContainer}>
               <label className={styles.statLabel}>Current Status</label>
               <select 
                 className={styles.statusSelect}
                 value={order.status}
                 onChange={(e) => updateStatus(e.target.value)}
                 disabled={statusLoading}
               >
                 <option value="inquiry">Inquiry</option>
                 <option value="order_confirmed">Order Confirmed</option>
                 <option value="measurements_taken">Measurements Taken</option>
                 <option value="design_discussion">Design Discussion</option>
                 <option value="design_approved">Design Approved</option>
                 <option value="fabric_selected">Fabric Selected</option>
                 <option value="pattern_making">Pattern Making</option>
                 <option value="stitching">Stitching</option>
                 <option value="ready">Ready</option>
                 <option value="delivered">Delivered</option>
               </select>
             </div>
          </div>
        </div>

        <div className={styles.headerStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}><Calendar size={14} style={{ marginRight: 4 }} /> Event Date</span>
            <span className={styles.statValue}>{order.event_date ? new Date(order.event_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'None'}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}><Clock size={14} style={{ marginRight: 4 }} /> Project Deadline</span>
            <span className={styles.statValue} style={{ color: 'var(--error)' }}>{order.deadline ? new Date(order.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}><IndianRupee size={14} style={{ marginRight: 4 }} /> Est. Value</span>
            <span className={styles.statValue}>₹{order.estimated_amount?.toLocaleString() || '0'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsNav}>
        {[
          { id: 'overview', icon: <Tag size={18} />, label: 'Overview' },
          { id: 'outfits', icon: <ShoppingBag size={18} />, label: 'Outfits' },
          { id: 'measurements', icon: <Ruler size={18} />, label: 'Measurements' },
          { id: 'production', icon: <Activity size={18} />, label: 'Production' },
          { id: 'fabric', icon: <Scissors size={18} />, label: 'Fabric & Dyeing' },
          { id: 'payments', icon: <CreditCard size={18} />, label: 'Payments' },
          { id: 'timeline', icon: <History size={18} />, label: 'Timeline' },
        ].map((tab) => (
          <button 
            key={tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {tab.icon} {tab.label}
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.grid}>
             <div className={styles.card}>
                <h3 className={styles.cardTitle}>Project Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <span className={styles.statLabel}>Project Type</span>
                    <p style={{ fontWeight: 600 }}>{order.order_type || 'Custom Couture'}</p>
                  </div>
                  <div>
                    <span className={styles.statLabel}>Event Type</span>
                    <p style={{ fontWeight: 600 }}>{order.event_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className={styles.statLabel}>Internal Notes</span>
                    <p style={{ fontStyle: order.notes ? 'normal' : 'italic', color: order.notes ? 'inherit' : 'var(--text-muted)' }}>
                      {order.notes || 'No project notes added yet.'}
                    </p>
                  </div>
                </div>
             </div>
             <div className={styles.card}>
                <h3 className={styles.cardTitle}>Customer Contact</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <span className={styles.statLabel}>Phone</span>
                    <p style={{ fontWeight: 600 }}>{order.customers?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className={styles.statLabel}>Email</span>
                    <p style={{ fontWeight: 600 }}>{order.customers?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className={styles.statLabel}>Location</span>
                    <p style={{ fontWeight: 600 }}>{order.customers?.location || 'N/A'}</p>
                  </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'outfits' && (
          <div className={styles.card}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>Project Outfits</h3>
                <button className="btn btn-primary" style={{ gap: '0.5rem' }} onClick={() => setIsOutfitModalOpen(true)}>
                  <Plus size={18} /> Add Outfit
                </button>
             </div>
            
            {order.outfits?.length > 0 ? (
              order.outfits.map((outfit: any) => (
                <div key={outfit.id} className={styles.outfitItem}>
                  <div className={styles.outfitHeader}>
                    <span className={styles.outfitName}>{outfit.outfit_name}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => handleEditClick(outfit)}><Edit size={14} /></button>
                      <button className="btn btn-outline" style={{ padding: '0.25rem', color: 'var(--error)' }} onClick={() => setDeletingOutfitId(outfit.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className={styles.componentList}>
                    {outfit.outfit_components?.map((comp: any) => (
                      <span key={comp.id} className={styles.compBadge}>{comp.component_name}</span>
                    ))}
                    <button 
                      className={styles.compBadge} 
                      style={{ borderStyle: 'dashed', background: 'transparent' }}
                      onClick={() => handleAddQuickComponent(outfit.id)}
                    >
                      + Add Component
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                <ShoppingBag size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>No outfits added to this project yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Activity History</h3>
            <div className={styles.timeline}>
              {order.order_timeline?.length > 0 ? (
                order.order_timeline.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((event: any) => (
                  <div key={event.id} className={styles.timelineEvent}>
                    <div className={styles.eventMeta}>
                      <span className={styles.eventType}>{event.event_type.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className={styles.eventTime}>{new Date(event.created_at).toLocaleString()}</span>
                    </div>
                    <p className={styles.eventDesc}>{event.description}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Project launch initiated. No additional activity tracked yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'production' && (
           <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                 <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>Production Tracking</h3>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className={styles.compBadge} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      {order.outfits?.length || 0} Outfits
                    </span>
                 </div>
              </div>

              {order.outfits?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {order.outfits.map((outfit: any) => (
                    <div key={outfit.id} className={styles.outfitItem} style={{ borderStyle: 'solid', padding: '1.25rem' }}>
                      <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{outfit.outfit_name}</span>
                        <span style={{ marginLeft: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{outfit.outfit_type}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {outfit.outfit_components?.length > 0 ? (
                          outfit.outfit_components.map((comp: any) => (
                            <div key={comp.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', gap: '1rem', alignItems: 'center', background: 'var(--background)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                              <div>
                                <span style={{ fontWeight: 600 }}>{comp.component_name}</span>
                                {compLoading === comp.id && <Loader2 size={12} className="animate-spin" style={{ marginLeft: '0.5rem' }} />}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</label>
                                <select 
                                  className={styles.statusSelect} 
                                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                                  value={comp.status}
                                  onChange={(e) => updateComponentProduction(comp.id, { status: e.target.value }, outfit.outfit_name, comp.component_name)}
                                  disabled={compLoading === comp.id}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="fabric_sourcing">Fabric Sourcing</option>
                                  <option value="dyeing">Dyeing</option>
                                  <option value="pattern_making">Pattern Making</option>
                                  <option value="cutting">Cutting</option>
                                  <option value="embroidery">Embroidery</option>
                                  <option value="stitching">Stitching</option>
                                  <option value="finishing">Finishing</option>
                                  <option value="ready">Ready</option>
                                </select>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Assigned Tailor</label>
                                <select 
                                  className={styles.statusSelect} 
                                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                                  value={comp.assigned_tailor || ''}
                                  onChange={(e) => updateComponentProduction(comp.id, { assigned_tailor: e.target.value || null }, outfit.outfit_name, comp.component_name)}
                                  disabled={compLoading === comp.id}
                                >
                                  <option value="">Unassigned</option>
                                  {tailors.map(t => (
                                    <option key={t.id} value={t.id}>{t.full_name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>No components added to this outfit.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <ShoppingBag size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Add outfits to start production tracking.</p>
                </div>
              )}
           </div>
        )}

        {activeTab === 'measurements' && (
           <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                 <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>Linked Measurements</h3>
                 <button className="btn btn-primary" style={{ gap: '0.5rem' }} onClick={() => setIsMeasurementModalOpen(true)}>
                   <Plus size={18} /> Link measurements
                 </button>
              </div>

              {order.order_measurements?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {order.order_measurements.map((link: any) => {
                    const m = link.measurements;
                    return (
                      <div key={link.id} className={styles.outfitItem} style={{ borderStyle: 'solid' }}>
                        <div className={styles.outfitHeader}>
                          <span className={styles.outfitName}>
                            Record from {new Date(m.updated_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                          <button 
                            className="btn btn-outline" 
                            style={{ color: 'var(--error)', padding: '0.25rem' }}
                            onClick={() => unlinkMeasurement(link.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                          {Object.entries(m.measurement_data || {}).map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <span className={styles.statLabel} style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                                {key.replace(/_/g, ' ')}
                              </span>
                              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{value}"</p>
                            </div>
                          ))}
                        </div>
                        {m.notes && (
                          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                            <strong>Notes:</strong> {m.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '5rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <Ruler size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem', opacity: 0.5 }} />
                  <h3>Measurement Link Service</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '1rem auto' }}>
                    Select and link specific measurement records to this production project.
                  </p>
                  <button className="btn btn-primary" onClick={() => setIsMeasurementModalOpen(true)}>Link measurements</button>
                </div>
              )}
           </div>
        )}

        {activeTab === 'fabric' && (
           <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                 <div>
                   <h3 className={styles.cardTitle} style={{ marginBottom: '0.25rem' }}>Fabric Sourcing & Dyeing</h3>
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage required materials and external dyeing workflows.</p>
                 </div>
              </div>
              <FabricAndDyeingTab orderId={id} outfits={order.outfits || []} />
           </div>
        )}

        {activeTab === 'payments' && (
           <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                 <div>
                   <h3 className={styles.cardTitle} style={{ marginBottom: '0.25rem' }}>Project Payment Ledger</h3>
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Track advances, partial payments, and final settlements.</p>
                 </div>
                 <button className="btn btn-primary" style={{ gap: '0.5rem' }} onClick={() => setIsPaymentModalOpen(true)}>
                   <Plus size={18} /> Record Payment
                 </button>
              </div>

              {/* Financial Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Estimated Total</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{order.estimated_amount?.toLocaleString() || '0'}</div>
                </div>
                <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Received</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                    ₹{order.payments?.reduce((acc: number, p: any) => acc + (p.payment_type !== 'refund' ? Number(p.amount) : -Number(p.amount)), 0).toLocaleString() || '0'}
                  </div>
                </div>
                <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Balance Due</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                    ₹{((order.estimated_amount || 0) - (order.payments?.reduce((acc: number, p: any) => acc + (p.payment_type !== 'refund' ? Number(p.amount) : -Number(p.amount)), 0) || 0)).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Payments List */}
              {order.payments?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Payment History</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Type</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Method</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Reference</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.payments.sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()).map((payment: any) => (
                        <tr key={payment.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '1rem 0.5rem', fontSize: '0.9rem' }}>{new Date(payment.payment_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                             <span style={{ 
                               fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px',
                               background: payment.payment_type === 'advance' ? 'var(--primary)' : (payment.payment_type === 'refund' ? 'var(--error)' : 'var(--success)'),
                               color: 'white'
                             }}>
                               {payment.payment_type.replace(/_/g, ' ').toUpperCase()}
                             </span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem', fontSize: '0.9rem', textTransform: 'capitalize' }}>{payment.payment_method.replace(/_/g, ' ')}</td>
                          <td style={{ padding: '1rem 0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{payment.reference_number || '-'}</td>
                          <td style={{ padding: '1rem 0.5rem', fontSize: '1rem', fontWeight: 600, textAlign: 'right', color: payment.payment_type === 'refund' ? 'var(--error)' : 'inherit' }}>
                            {payment.payment_type === 'refund' ? '-' : ''}₹{Number(payment.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', marginTop: '1rem' }}>
                  <CreditCard size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem', opacity: 0.5 }} />
                  <p style={{ color: 'var(--text-muted)' }}>No payments recorded for this project yet.</p>
                </div>
              )}
           </div>
        )}
      </div>

      <Modal
        isOpen={isOutfitModalOpen}
        onClose={() => { setIsOutfitModalOpen(false); setEditingOutfit(null); }}
        title={editingOutfit ? "Edit Outfit Details" : "Add New Outfit to Project"}
      >
        <div style={{ padding: '1rem' }}>
          <AddOutfitForm 
            orderId={id}
            initialData={editingOutfit}
            onSuccess={() => {
              setIsOutfitModalOpen(false);
              setEditingOutfit(null);
              fetchOrderDetails();
            }}
            onCancel={() => { setIsOutfitModalOpen(false); setEditingOutfit(null); }}
          />
        </div>
      </Modal>

      {/* Measurement Linking Modal */}
      <Modal
        isOpen={isMeasurementModalOpen}
        onClose={() => setIsMeasurementModalOpen(false)}
        title="Link Measurement Record"
      >
        <div style={{ padding: '1rem' }}>
          <LinkMeasurementForm 
            orderId={id}
            customerId={order.customer_id}
            onSuccess={() => {
              setIsMeasurementModalOpen(false);
              fetchOrderDetails();
            }}
            onCancel={() => setIsMeasurementModalOpen(false)}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingOutfitId}
        onClose={() => setDeletingOutfitId(null)}
        title="Confirm Deletion"
      >
        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
          <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>Are you sure you want to delete this outfit?</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>This action will also remove all related components and cannot be undone.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => setDeletingOutfitId(null)}>Cancel</button>
            <button className="btn" style={{ background: 'var(--error)', color: 'white' }} onClick={deleteOutfit}>Delete Outfit</button>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment for ${order.order_number}`}
      >
        <div style={{ padding: '1rem' }}>
          <AddPaymentForm 
            orderId={id}
            customerId={order.customer_id}
            onSuccess={() => {
              setIsPaymentModalOpen(false);
              fetchOrderDetails();
            }}
            onCancel={() => setIsPaymentModalOpen(false)}
          />
        </div>
      </Modal>
    </div>
  );
}
