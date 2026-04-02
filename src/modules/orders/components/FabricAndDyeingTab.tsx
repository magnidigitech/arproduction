import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, Scissors, Droplets, ArrowRight } from 'lucide-react';
import Modal from '@/core/components/Modal';
import styles from './fabric-dyeing.module.css';

export default function FabricAndDyeingTab({ orderId, outfits, viewMode = 'both' }: { orderId: string, outfits: any[], viewMode?: 'fabric' | 'dyeing' | 'both' }) {
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [dyeingTasks, setDyeingTasks] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFabricModalOpen, setIsFabricModalOpen] = useState(false);
  const [isDyeingModalOpen, setIsDyeingModalOpen] = useState(false);
  const [selectedFabricForDyeing, setSelectedFabricForDyeing] = useState<any>(null);

  // Forms
  const [fabricForm, setFabricForm] = useState({ outfit_id: '', fabric_type: '', color: '', quantity_required: '', unit: 'meters', status: 'to_buy', cost: '' });
  const [dyeingForm, setDyeingForm] = useState({ dyer_name: '', color_reference: '', status: 'pending', sent_date: '', expected_date: '', cost: '' });
  const [editingFabricId, setEditingFabricId] = useState<string | null>(null);

  // Delete Confirmation
  const [fabricToDelete, setFabricToDelete] = useState<{ id: string, name: string } | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Status Change Confirmation
  const [statusChangeFabric, setStatusChangeFabric] = useState<any | null>(null);
  const [statusChangeCost, setStatusChangeCost] = useState('');
  const [statusChangeError, setStatusChangeError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const outfitIds = outfits.map(o => o.id);
      if (outfitIds.length === 0) {
        setLoading(false);
        return;
      }

      const [fabricsRes, dyeingRes, vendorsRes] = await Promise.all([
        supabase.from('required_fabrics').select('*, outfits(outfit_name)').in('outfit_id', outfitIds).order('created_at', { ascending: false }),
        supabase.from('dyeing_tasks').select('*, required_fabrics(fabric_type), outfits(outfit_name)').in('outfit_id', outfitIds).order('created_at', { ascending: false }),
        supabase.from('vendors').select('*').in('type', ['dyeing', 'other']).order('name')
      ]);

      if (fabricsRes.error) throw fabricsRes.error;
      if (dyeingRes.error) throw dyeingRes.error;
      if (vendorsRes.error) throw vendorsRes.error;

      setFabrics(fabricsRes.data || []);
      setDyeingTasks(dyeingRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch (error: any) {
      console.error('Error fetching fabric data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [outfits]);

  const handleAddFabric = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...fabricForm,
        cost: fabricForm.cost ? parseFloat(fabricForm.cost) : 0,
        quantity_required: fabricForm.quantity_required ? parseFloat(fabricForm.quantity_required) : 0,
        bought_date: fabricForm.status === 'bought' ? new Date().toISOString() : null
      };

      if (editingFabricId) {
        const { error } = await supabase.from('required_fabrics').update(payload).eq('id', editingFabricId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('required_fabrics').insert(payload);
        if (error) throw error;
      }

      setIsFabricModalOpen(false);
      setEditingFabricId(null);
      setFabricForm({ outfit_id: '', fabric_type: '', color: '', quantity_required: '', unit: 'meters', status: 'to_buy', cost: '' });
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEditFabric = (fabric: any) => {
    setEditingFabricId(fabric.id);
    setFabricForm({
      outfit_id: fabric.outfit_id || '',
      fabric_type: fabric.fabric_type || '',
      color: fabric.color || '',
      quantity_required: fabric.quantity_required || '',
      unit: fabric.unit || 'meters',
      status: fabric.status || 'to_buy',
      cost: fabric.cost || ''
    });
    setIsFabricModalOpen(true);
  };

  const promptDeleteFabric = (id: string, name: string) => {
    setFabricToDelete({ id, name });
    setDeleteConfirmationText('');
  };

  const executeDeleteFabric = async () => {
    if (!fabricToDelete) return;
    try {
      const { error } = await supabase.from('required_fabrics').delete().eq('id', fabricToDelete.id);
      if (error) throw error;
      setFabricToDelete(null);
      fetchData();
    } catch (error: any) {
       alert(error.message);
    }
  };

  const handleSendToDyeing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('dyeing_tasks').insert({
        ...dyeingForm,
        fabric_id: selectedFabricForDyeing.id,
        outfit_id: selectedFabricForDyeing.outfit_id,
        cost: dyeingForm.cost ? parseFloat(dyeingForm.cost) : 0,
      });
      if (error) throw error;

      // Auto-move components to 'dyeing' on the Kanban board
      await supabase.from('outfit_components').update({ status: 'dyeing' }).eq('outfit_id', selectedFabricForDyeing.outfit_id);

      setIsDyeingModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const updateFabricStatus = async (id: string, newStatus: string, cost?: number) => {
    const payload: any = { status: newStatus };
    if (newStatus === 'bought') {
      payload.bought_date = new Date().toISOString();
      if (cost !== undefined) payload.cost = cost;
    } else {
      payload.bought_date = null;
    }

    await supabase.from('required_fabrics').update(payload).eq('id', id);
    fetchData();
  };

  const handleStatusChangeClick = (fabric: any, newStatus: string) => {
    if (newStatus === 'bought') {
      setStatusChangeError('');
      setStatusChangeFabric(fabric);
      setStatusChangeCost(fabric.cost ? String(fabric.cost) : '');
    } else {
      updateFabricStatus(fabric.id, newStatus);
    }
  };

  const confirmStatusChange = () => {
    if (!statusChangeFabric) return;
    const finalCost = statusChangeCost ? parseFloat(statusChangeCost) : 0;
    
    // Require cost to be entered if it's 0 or empty
    if (finalCost <= 0) {
      setStatusChangeError("Please enter a valid cost amount");
      return;
    }

    updateFabricStatus(statusChangeFabric.id, 'bought', finalCost);
    setStatusChangeFabric(null);
    setStatusChangeCost('');
    setStatusChangeError('');
  };

  const updateDyeingStatus = async (id: string, newStatus: string) => {
    await supabase.from('dyeing_tasks').update({ 
      status: newStatus,
      received_date: newStatus === 'received' ? new Date().toISOString() : null
    }).eq('id', id);
    fetchData();
  };

  if (outfits.length === 0) {
    return <div className={styles.emptyState}>Please add an outfit to this project before planning fabrics.</div>;
  }

  const totalFabricCost = fabrics.reduce((sum, f) => sum + Number(f.cost || 0), 0);
  const totalDyeingCost = dyeingTasks.reduce((sum, d) => sum + Number(d.cost || 0), 0);

  return (
    <div>
      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Fabric Cost</div>
          <div className={styles.summaryValue}>₹{totalFabricCost.toLocaleString('en-IN')}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Dyeing Cost</div>
          <div className={styles.summaryValue}>₹{totalDyeingCost.toLocaleString('en-IN')}</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.primaryCard}`}>
          <div className={`${styles.summaryLabel} ${styles.primaryValue}`}>Total Sourcing Cost</div>
          <div className={`${styles.summaryValue} ${styles.primaryValue}`}>₹{(totalFabricCost + totalDyeingCost).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className={`${styles.mainGrid} ${viewMode !== 'both' ? styles.singleColumn : ''}`}>
        {/* Fabric Sourcing Section */}
        {viewMode !== 'dyeing' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Scissors size={18} color="var(--primary)" /> Required Fabrics
            </h3>
            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => {
              setEditingFabricId(null);
              setFabricForm({ outfit_id: outfits[0]?.id || '', fabric_type: '', color: '', quantity_required: '', unit: 'meters', status: 'to_buy', cost: '' });
              setIsFabricModalOpen(true);
            }}>
              <Plus size={14} style={{ marginRight: '4px' }} /> Add Fabric
            </button>
          </div>

          <div className={styles.cardList}>
            {fabrics.map((fabric) => (
              <div key={fabric.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <span>{fabric.fabric_type}</span>
                    <span className={styles.cardSubtitle}>for {fabric.outfits?.outfit_name}</span>
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.actionBtn} onClick={() => handleEditFabric(fabric)} title="Edit">
                      <Edit size={14} />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => promptDeleteFabric(fabric.id, fabric.fabric_type)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <select 
                    value={fabric.status} 
                    onChange={(e) => handleStatusChangeClick(fabric, e.target.value)}
                    className={styles.statusSelect}
                    style={{ 
                      background: fabric.status === 'bought' ? 'var(--success)' : 'var(--warning)', 
                    }}
                  >
                    <option value="to_buy">To Buy</option>
                    <option value="bought">Bought</option>
                  </select>
                </div>
                
                <div className={styles.cardRow}>
                  <div>
                    <span>{fabric.color || 'No Color'}</span>
                    <span style={{ margin: '0 0.5rem' }}>•</span>
                    {fabric.quantity_required} {fabric.unit}
                  </div>
                  <div className={styles.cardCost}>
                    ₹{fabric.cost || 0}
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <button 
                    className="btn btn-outline" 
                    disabled={fabric.status !== 'bought'}
                    style={{ 
                      padding: '0.2rem 0.5rem', 
                      fontSize: '0.75rem', 
                      gap: '0.25rem',
                      opacity: fabric.status !== 'bought' ? 0.5 : 1,
                      cursor: fabric.status !== 'bought' ? 'not-allowed' : 'pointer'
                    }} 
                    onClick={() => {
                      if (fabric.status !== 'bought') return;
                      setSelectedFabricForDyeing(fabric);
                      setDyeingForm({ ...dyeingForm, color_reference: fabric.color || '' });
                      setIsDyeingModalOpen(true);
                    }}
                    title={fabric.status !== 'bought' ? "Fabric must be Bought first" : "Send to Dyeing"}
                  >
                    Send to Dyeing <Droplets size={12} color={fabric.status === 'bought' ? "var(--primary)" : "currentColor"} />
                  </button>
                </div>
              </div>
            ))}
            {fabrics.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>No fabrics added yet.</div>}
          </div>
        </div>
        )}

        {/* Dyeing Tracker Section */}
        {viewMode !== 'fabric' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Droplets size={18} color="#0EA5E9" /> Dyeing Status
            </h3>
          </div>

          <div className={styles.cardList}>
            {dyeingTasks.map((task) => (
              <div key={task.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <span>{task.required_fabrics?.fabric_type || 'Fabric'}</span>
                    <span className={styles.cardSubtitle} style={{ marginLeft: '0.5rem' }}>for {task.outfits?.outfit_name}</span>
                  </div>
                  <select 
                    value={task.status} 
                    onChange={(e) => updateDyeingStatus(task.id, e.target.value)}
                    className={styles.statusSelect}
                    style={{ 
                      background: task.status === 'received' ? 'var(--success)' : (task.status === 'at_dyeing' ? '#0EA5E9' : 'var(--warning)'), 
                    }}
                  >
                    <option value="pending">Pending pickup</option>
                    <option value="at_dyeing">At Dyeing</option>
                    <option value="received">Received</option>
                  </select>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <div style={{ marginBottom: '0.25rem' }}><strong>Vendor:</strong> {task.dyer_name || 'N/A'}</div>
                  <div><strong>Color Match:</strong> {task.color_reference || 'N/A'}</div>
                </div>

                <div className={`${styles.cardRow} ${styles.cardFooter}`} style={{ borderTopStyle: 'dashed' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Sent: {task.sent_date ? new Date(task.sent_date).toLocaleDateString() : '-'} 
                    <ArrowRight size={12} /> 
                    Expected: {task.expected_date ? new Date(task.expected_date).toLocaleDateString() : '-'}
                  </div>
                  <div className={styles.cardCost}>
                    ₹{task.cost || 0}
                  </div>
                </div>
              </div>
            ))}
            {dyeingTasks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>No fabrics sent for dyeing.</div>}
          </div>
        </div>
        )}
      </div>

      {/* Add Fabric Modal */}
      <Modal isOpen={isFabricModalOpen} onClose={() => setIsFabricModalOpen(false)} title={editingFabricId ? "Edit Required Fabric" : "Add Required Fabric"}>
        <form onSubmit={handleAddFabric} className={styles.form}>
          <div className={styles.formField}>
            <label className={styles.label}>Select Outfit *</label>
            <select required value={fabricForm.outfit_id} onChange={e => setFabricForm({...fabricForm, outfit_id: e.target.value})} className="input" style={{ width: '100%', padding: '0.6rem' }}>
              <option value="">-- Choose Outfit --</option>
              {outfits.map(o => <option key={o.id} value={o.id}>{o.outfit_name}</option>)}
            </select>
          </div>
          <div className={styles.formGrid2}>
            <div className={styles.formField}>
              <label className={styles.label}>Fabric Type *</label>
              <input required type="text" placeholder="e.g. Raw Silk" value={fabricForm.fabric_type} onChange={e => setFabricForm({...fabricForm, fabric_type: e.target.value})} className="input" style={{ width: '100%', padding: '0.6rem' }} />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Color/Dye Required</label>
              <input type="text" placeholder="e.g. Maroon or Undyed" value={fabricForm.color} onChange={e => setFabricForm({...fabricForm, color: e.target.value})} className="input" style={{ width: '100%', padding: '0.6rem' }} />
            </div>
          </div>
          <div className={styles.formGrid3}>
            <div className={styles.formField}>
              <label className={styles.label}>Quantity</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" step="0.1" value={fabricForm.quantity_required} onChange={e => setFabricForm({...fabricForm, quantity_required: e.target.value})} className="input" style={{ width: '100%', padding: '0.6rem' }} />
                <select value={fabricForm.unit} onChange={e => setFabricForm({...fabricForm, unit: e.target.value})} className="input" style={{ padding: '0.6rem' }}>
                  <option value="meters">Meters</option>
                  <option value="pieces">Pieces</option>
                </select>
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Status</label>
              <select value={fabricForm.status} onChange={e => setFabricForm({...fabricForm, status: e.target.value})} className="input" style={{ width: '100%', padding: '0.6rem' }}>
                <option value="to_buy">To Buy</option>
                <option value="bought">Already Bought</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Cost Amount (₹)</label>
              <input type="number" placeholder="0.00" value={fabricForm.cost} onChange={e => setFabricForm({...fabricForm, cost: e.target.value})} className="input" style={{ width: '100%', padding: '0.6rem' }} />
            </div>
          </div>
          <div className={styles.cardFooter}>
            <button type="button" className="btn btn-outline" style={{ marginRight: '1rem' }} onClick={() => setIsFabricModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Fabric</button>
          </div>
        </form>
      </Modal>

      {/* Dyeing Form Modal */}
      <Modal isOpen={isDyeingModalOpen} onClose={() => setIsDyeingModalOpen(false)} title={`Send "${selectedFabricForDyeing?.fabric_type}" for Dyeing`}>
        <form onSubmit={handleSendToDyeing} className={styles.form}>
          <div className={styles.formField}>
            <label className={styles.label}>Vendor / Dyer Name</label>
            <select required value={dyeingForm.dyer_name} onChange={e => setDyeingForm({...dyeingForm, dyer_name: e.target.value})} className="input" style={{ width: '100%', padding: '0.6rem' }}>
              <option value="">-- Select Vendor --</option>
              {vendors.map(v => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
             <label className={styles.label}>Color Match Reference *</label>
             <input required type="text" placeholder='e.g. "Match to dupatta Pantone 123"' value={dyeingForm.color_reference} onChange={e => setDyeingForm({...dyeingForm, color_reference: e.target.value})} className="input" style={{ width: '100%', padding: '0.6rem' }} />
          </div>
          <div className={styles.formGrid2}>
             <div className={styles.formField}>
                <label className={styles.label}>Sent Date</label>
                <input type="date" value={dyeingForm.sent_date} onChange={e => setDyeingForm({...dyeingForm, sent_date: e.target.value})} className="input" style={{ width: '100%', padding: '0.6rem' }} />
             </div>
             <div className={styles.formField}>
                <label className={styles.label}>Expected Return Date</label>
                <input type="date" value={dyeingForm.expected_date} onChange={e => setDyeingForm({...dyeingForm, expected_date: e.target.value})} className="input" style={{ width: '100%', padding: '0.6rem' }} />
             </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>Estimated Cost (₹)</label>
            <input type="number" placeholder="0.00" value={dyeingForm.cost} onChange={e => setDyeingForm({...dyeingForm, cost: e.target.value})} className="input" style={{ width: '100%', padding: '0.6rem' }} />
          </div>
          <div className={styles.cardFooter}>
            <button type="button" className="btn btn-outline" style={{ marginRight: '1rem' }} onClick={() => setIsDyeingModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ background: '#0EA5E9' }}>Confirm Out to Dyeing</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!fabricToDelete} onClose={() => setFabricToDelete(null)} title="Confirm Deletion">
        <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            This action cannot be undone. This will permanently delete the <strong>{fabricToDelete?.name}</strong> fabric requirement from this project.
          </p>
          <div className={styles.formField}>
            <label className={styles.label}>
              Please type <strong>{fabricToDelete?.name}</strong> to confirm.
            </label>
            <input 
              type="text" 
              className="input" 
              style={{ width: '100%', padding: '0.6rem' }} 
              value={deleteConfirmationText} 
              onChange={e => setDeleteConfirmationText(e.target.value)} 
              placeholder={fabricToDelete?.name} 
            />
          </div>
          <div className={styles.cardFooter}>
            <button className="btn btn-outline" style={{ marginRight: '1rem' }} onClick={() => setFabricToDelete(null)}>Cancel</button>
            <button 
              className="btn btn-primary" 
              style={{ background: 'var(--error)' }} 
              onClick={executeDeleteFabric}
              disabled={deleteConfirmationText !== fabricToDelete?.name}
            >
              Delete Fabric
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Change to Bought Modal */}
      <Modal isOpen={!!statusChangeFabric} onClose={() => setStatusChangeFabric(null)} title="Confirm Purchase">
        <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            You are marking <strong>{statusChangeFabric?.fabric_type}</strong> as Bought. Please confirm the final purchase amount.
          </p>
          <div className={styles.formField}>
            <label className={styles.label}>
              Final Cost (₹) *
            </label>
            <input 
              type="number" 
              step="0.01"
              className={`input ${statusChangeError ? 'border-error' : ''}`}
              style={{ width: '100%', padding: '0.6rem', borderColor: statusChangeError ? 'var(--error)' : undefined }} 
              value={statusChangeCost} 
              onChange={e => {
                setStatusChangeCost(e.target.value);
                if (statusChangeError) setStatusChangeError('');
              }} 
              placeholder="0.00" 
              autoFocus
            />
            {statusChangeError && (
              <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 500 }}>
                {statusChangeError}
              </div>
            )}
          </div>
          <div className={styles.cardFooter}>
            <button className="btn btn-outline" style={{ marginRight: '1rem' }} onClick={() => setStatusChangeFabric(null)}>Cancel</button>
            <button 
              className="btn btn-primary" 
              style={{ background: 'var(--success)', color: 'white' }} 
              onClick={confirmStatusChange}
            >
              Confirm Purchased
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
