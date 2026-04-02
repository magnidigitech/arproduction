'use client';
import { useState, useEffect } from 'react';
import { Search, Columns3, MoreHorizontal, User, Calendar, Scissors, Box, Loader2, MessageCircle, Droplets } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Modal from '@/core/components/Modal';
import FabricAndDyeingTab from '@/modules/orders/components/FabricAndDyeingTab';
import styles from './production.module.css';

const COLUMNS = [
  'pending',
  'fabric_sourcing',
  'dyeing',
  'pattern_making',
  'cutting',
  'embroidery',
  'stitching',
  'finishing',
  'ready'
];

export default function ProductionKanbanPage() {
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Filters
  const [filterOrder, setFilterOrder] = useState('');
  const [filterTailor, setFilterTailor] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [componentsSearch, setComponentsSearch] = useState('');

  // WhatsApp Feature
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [shareMode, setShareMode] = useState<'menu' | 'orders' | 'tailor' | 'preview'>('menu');
  const [selectedShareOrders, setSelectedShareOrders] = useState<string[]>([]);
  const [selectedShareTailor, setSelectedShareTailor] = useState('');
  const [waMessage, setWaMessage] = useState('');

  // Sourcing Modal
  const [isSourcingModalOpen, setIsSourcingModalOpen] = useState(false);
  const [activeOutfit, setActiveOutfit] = useState<any>(null);
  const [sourcingViewMode, setSourcingViewMode] = useState<'fabric' | 'dyeing'>('fabric');

  // Tailor Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetStatus, setAssignTargetStatus] = useState('');
  const [assignDropComponent, setAssignDropComponent] = useState<any>(null);
  const [assignTailorId, setAssignTailorId] = useState('');
  const [allTailorsList, setAllTailorsList] = useState<any[]>([]);

  const fetchProductionBoard = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('outfit_components')
        .select(`
          *,
          internal_team(id, full_name),
          outfits(
            id,
            outfit_name,
            orders(
              order_number,
              deadline,
              priority,
              customers(full_name)
            )
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setComponents(data || []);
    } catch (error: any) {
      console.error('Error fetching production board:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTailors = async () => {
    try {
      const { data, error } = await supabase.from('internal_team').select('id, full_name, role').order('full_name');
      if (error) throw error;
      setAllTailorsList(data || []);
    } catch (error: any) {
      console.error('Error fetching tailors:', error.message);
    }
  };

  useEffect(() => {
    fetchProductionBoard();
    fetchAllTailors();
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    // Visual tweak optional: e.target.style.opacity = '0.5';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const sourceComponent = components.find(c => c.id === draggedItem);
    if (!sourceComponent) return;

    // Ignore drops if the card hasn't moved columns
    if ((sourceComponent.status || 'pending') === newStatus) {
      setDraggedItem(null);
      return;
    }

    const isSourcingStage = newStatus === 'fabric_sourcing' || newStatus === 'dyeing';
    const isPendingStage = newStatus === 'pending';

    // Intercept drops into active production stages
    if (!isSourcingStage && !isPendingStage) {
      setAssignDropComponent(sourceComponent);
      setAssignTargetStatus(newStatus);
      // Pre-select current tailor if assigned, else empty string
      setAssignTailorId(sourceComponent.assigned_tailor || '');
      setIsAssignModalOpen(true);
      return; // Pause execution
    }

    // Optimistic update
    if (isSourcingStage) {
      setComponents(prev => prev.map(c => c.outfits?.id === sourceComponent.outfits?.id ? { ...c, status: newStatus } : c));
    } else {
      setComponents(prev => prev.map(c => c.id === draggedItem ? { ...c, status: newStatus } : c));
    }
    setDraggedItem(null);

    // Backend update
    try {
      if (isSourcingStage) {
         const { error } = await supabase
           .from('outfit_components')
           .update({ status: newStatus })
           .eq('outfit_id', sourceComponent.outfits?.id);
         if (error) throw error;
      } else {
         const { error } = await supabase
           .from('outfit_components')
           .update({ status: newStatus })
           .eq('id', draggedItem);
         if (error) throw error;
      }
    } catch (error: any) {
      alert('Failed to update stage: ' + error.message);
      fetchProductionBoard(); // Rollback
    }
  };

  const confirmAssignDrop = async () => {
    if (!assignDropComponent) return;

    // Determine tailor object for optimistic update
    const selectedTailorObj = allTailorsList.find(t => t.id === assignTailorId);

    // Optimistic update
    setComponents(prev => prev.map(c => c.id === assignDropComponent.id ? { 
      ...c, 
      status: assignTargetStatus, 
      assigned_tailor: assignTailorId || null,
      internal_team: selectedTailorObj ? { id: selectedTailorObj.id, full_name: selectedTailorObj.full_name } : null
    } : c));

    setDraggedItem(null);
    setIsAssignModalOpen(false);

    try {
      const { error } = await supabase
        .from('outfit_components')
        .update({ 
          status: assignTargetStatus, 
          assigned_tailor: assignTailorId || null 
        })
        .eq('id', assignDropComponent.id);
        
      if (error) throw error;
    } catch (error: any) {
      alert('Failed to assign tailor: ' + error.message);
      fetchProductionBoard(); // Rollback
    }

    setAssignDropComponent(null);
  };

  const getPriorityClass = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return styles.priorityHigh;
      case 'medium': return styles.priorityMed;
      case 'low': return styles.priorityLow;
      default: return styles.priorityMed;
    }
  };

  const handleGenerateWaMessage = (targetComponents: any[] = components) => {
    // Group components by order
    const ordersMap: Record<string, any> = {};

    targetComponents.forEach((comp) => {
      const order = comp.outfits?.orders;
      if (!order) return;
      
      const orderId = order.order_number;
      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          orderInfo: order,
          statuses: {}
        };
      }
      
      const statusKey = (comp.status || 'pending').toUpperCase().replace(/_/g, ' ');
      if (!ordersMap[orderId].statuses[statusKey]) {
        ordersMap[orderId].statuses[statusKey] = [];
      }
      ordersMap[orderId].statuses[statusKey].push(comp);
    });

    let message = "PRODUCTION UPDATE\n--------------------------------------------------\n\n";

    Object.values(ordersMap).sort((a: any, b: any) => {
       // Sort by deadline if possible
       const dateA = a.orderInfo.deadline ? new Date(a.orderInfo.deadline).getTime() : Infinity;
       const dateB = b.orderInfo.deadline ? new Date(b.orderInfo.deadline).getTime() : Infinity;
       return dateA - dateB;
    }).forEach((orderGroup: any) => {
       const order = orderGroup.orderInfo;
       const delivery = order.deadline ? new Date(order.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'N/A';
       
       message += `Order ID : ${order.order_number || 'Unknown'}\n`;
       message += `Client   : ${order.customers?.full_name || 'N/A'}\n`;
       message += `Delivery : ${delivery}\n\n`;

       // Preferred order of statuses
       const statusOrder = ['PENDING', 'FABRIC SOURCING', 'DYEING', 'PATTERN MAKING', 'CUTTING', 'EMBROIDERY', 'STITCHING', 'FINISHING', 'READY'];
       const availableStatuses = Object.keys(orderGroup.statuses).sort((a, b) => {
          const idxA = statusOrder.indexOf(a);
          const idxB = statusOrder.indexOf(b);
          return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
       });

       availableStatuses.forEach(statusKey => {
         message += `${statusKey}\n`;
         orderGroup.statuses[statusKey].forEach((comp: any) => {
           let assigneeName = 'Unassigned';
           if (comp.internal_team?.full_name) {
             assigneeName = comp.internal_team.full_name;
           }
           let priorityStr = order.priority && order.priority.toLowerCase() !== 'medium' ? ` [${order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}]` : '';
           
           message += `- ${comp.component_name} (${assigneeName})${priorityStr}\n`;
         });
         message += '\n';
       });
       
       message += "--------------------------------------------------\n\n";
    });

    setWaMessage(message.trim());
    setShareMode('preview');
  };

  const shareViaWhatsApp = () => {
    const encoded = encodeURIComponent(waMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    setIsWaModalOpen(false);
    setShareMode('menu');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading live production board...</p>
      </div>
    );
  }

  // Derived options from data
  const uniqueTailors = Array.from(new Set(components.filter(c => c.internal_team?.full_name).map(c => c.internal_team.full_name))).sort();
  const uniqueOrders = Array.from(new Set(components.filter(c => c.outfits?.orders?.order_number).map(c => c.outfits.orders.order_number))).sort();

  // Apply filters
  const filteredComponents = components.filter(c => {
    let match = true;
    if (filterOrder && c.outfits?.orders?.order_number !== filterOrder) match = false;
    if (filterTailor && c.internal_team?.full_name !== filterTailor) match = false;
    if (filterPriority && (c.outfits?.orders?.priority || 'medium').toLowerCase() !== filterPriority.toLowerCase()) match = false;
    
    if (componentsSearch) {
      const query = componentsSearch.toLowerCase();
      const matchesSearch = 
        (c.component_name || '').toLowerCase().includes(query) ||
        (c.outfits?.outfit_name || '').toLowerCase().includes(query) ||
        (c.outfits?.orders?.order_number || '').toLowerCase().includes(query) ||
        (c.outfits?.orders?.customers?.full_name || '').toLowerCase().includes(query);
      if (!matchesSearch) match = false;
    }
    
    return match;
  });

  // Group components into columns
  const columnData = COLUMNS.map(col => ({
    id: col,
    title: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    cards: filteredComponents.filter(c => (c.status || 'pending') === col)
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 className={styles.title}>Live Production Board</h1>
          <button className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.4rem 0.8rem', background: '#25D366' }} onClick={() => {
            setShareMode('menu');
            setSelectedShareOrders([]);
            setSelectedShareTailor('');
            setIsWaModalOpen(true);
          }}>
            <MessageCircle size={16} /> Share via WhatsApp
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search components or customers..." 
              className="input" 
              style={{ padding: '0.4rem 0.75rem 0.4rem 2.2rem', fontSize: '0.85rem', width: '100%' }}
              value={componentsSearch}
              onChange={(e) => setComponentsSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="input" 
            style={{ padding: '0.4rem', fontSize: '0.85rem', width: '150px' }}
            value={filterOrder}
            onChange={(e) => setFilterOrder(e.target.value)}
          >
            <option value="">All Orders</option>
            {uniqueOrders.map((order: any) => (
              <option key={order} value={order}>{order}</option>
            ))}
          </select>

          <select 
            className="input" 
            style={{ padding: '0.4rem', fontSize: '0.85rem', width: '150px' }}
            value={filterTailor}
            onChange={(e) => setFilterTailor(e.target.value)}
          >
            <option value="">All Assignees</option>
            {uniqueTailors.map((tailor: any) => (
              <option key={tailor} value={tailor}>{tailor}</option>
            ))}
          </select>

          <select 
            className="input" 
            style={{ padding: '0.4rem', fontSize: '0.85rem', width: '130px' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {(filterOrder || filterTailor || filterPriority) && (
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--error)' }}
              onClick={() => {
                setFilterOrder('');
                setFilterTailor('');
                setFilterPriority('');
              }}
            >
              Clear Filters
            </button>
          )}

        </div>
      </div>

      <div className={styles.boardContainer}>
        {columnData.map(col => (
          <div 
            key={col.id} 
            className={styles.column}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            style={{ 
              backgroundColor: draggedItem ? 'rgba(0,0,0,0.01)' : 'var(--surface)', 
              transition: 'background-color 0.2s',
              minHeight: '60vh'
            }}
          >
            <div className={styles.columnHeader}>
              <div className={styles.columnTitle}>
                {col.title} <span className={`${styles.columnCount} ${col.cards.length > 5 ? styles.columnCountWarning : ''}`}>{col.cards.length}</span>
              </div>
              <button style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <MoreHorizontal size={18} />
              </button>
            </div>
            
            <div className={styles.cardsContainer}>
              {col.cards.map((card) => {
                const orderData = card.outfits?.orders || {};
                const customerData = orderData.customers || {};
                
                const isOverdue = orderData.deadline && new Date(orderData.deadline).getTime() < new Date().getTime() && card.status !== 'ready';

                return (
                  <div 
                    key={card.id} 
                    className={styles.kanbanCard}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    style={{ opacity: draggedItem === card.id ? 0.5 : 1, borderColor: isOverdue ? 'rgba(239, 68, 68, 0.5)' : undefined }}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.itemName} title={card.component_name}>
                        {card.component_name}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {(card.status === 'fabric_sourcing' || card.status === 'dyeing') && (
                          <button 
                            className={`${styles.actionIcon} ${styles.pulseAnimation}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveOutfit({ id: card.outfits.id, outfit_name: card.outfits.outfit_name, orders: orderData });
                              setSourcingViewMode(card.status === 'fabric_sourcing' ? 'fabric' : 'dyeing');
                              setIsSourcingModalOpen(true);
                            }}
                            title={`Manage ${card.status.replace('_', ' ')}`}
                          >
                            {card.status === 'fabric_sourcing' ? <Box size={14} /> : <Droplets size={14} />}
                          </button>
                        )}
                        <span className={`${styles.priorityFlag} ${getPriorityClass(orderData.priority)}`} title={`${orderData.priority || 'Medium'} Priority`}></span>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>
                      {card.outfits?.outfit_name}
                    </div>

                    <div className={styles.cardDetails}>
                      <div className={styles.cardMeta} title="Order Number">
                        <Box size={14} /> {orderData.order_number || 'No Order'}
                      </div>
                      <div className={styles.customerName} title="Customer">
                        <User size={14} /> {customerData.full_name || 'No Customer'}
                      </div>
                    </div>

                      <div className={styles.cardFooter}>
                      <div className={styles.assignee} title={`Assignee: ${card.internal_team?.full_name || 'Unassigned'}`}>
                        {card.internal_team?.full_name || 'Unassigned'}
                      </div>
                      <div className={isOverdue ? `${styles.dueDate} ${styles.dueDateOverdue}` : styles.dueDate} title={isOverdue ? "Overdue Project Deadline" : "Project Deadline"}>
                        <Calendar size={12} /> {orderData.deadline ? new Date(orderData.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isWaModalOpen} onClose={() => setIsWaModalOpen(false)} title="WhatsApp Production Update">
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', maxHeight: '70vh' }}>
          
          {shareMode === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '1rem', fontSize: '1rem' }} onClick={() => handleGenerateWaMessage(components)}>
                <Box size={18} style={{ marginRight: '0.5rem' }} /> Send Entire Production
              </button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '1rem', fontSize: '1rem' }} onClick={() => setShareMode('orders')}>
                <Scissors size={18} style={{ marginRight: '0.5rem' }} /> Send Specific Orders
              </button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '1rem', fontSize: '1rem' }} onClick={() => setShareMode('tailor')}>
                <User size={18} style={{ marginRight: '0.5rem' }} /> Send Specific Master Work
              </button>
            </div>
          )}

          {shareMode === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select the orders you want to include in the message.</p>
              
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                {uniqueOrders.map((order: any) => (
                  <label key={order} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedShareOrders.includes(order)} 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedShareOrders(prev => [...prev, order]);
                        else setSelectedShareOrders(prev => prev.filter(o => o !== order));
                      }} 
                    />
                    <span style={{ fontSize: '0.9rem' }}>{order}</span>
                  </label>
                ))}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setShareMode('menu')}>Back</button>
                <button 
                  className="btn btn-primary" 
                  disabled={selectedShareOrders.length === 0}
                  onClick={() => {
                    const filtered = components.filter(c => selectedShareOrders.includes(c.outfits?.orders?.order_number));
                    handleGenerateWaMessage(filtered);
                  }}
                >
                  Generate Preview
                </button>
              </div>
            </div>
          )}

          {shareMode === 'tailor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select a Master/Tailor to generate a specific work list.</p>
              
              <select 
                className="input" 
                style={{ padding: '0.75rem', fontSize: '1rem' }}
                value={selectedShareTailor}
                onChange={(e) => setSelectedShareTailor(e.target.value)}
              >
                <option value="">-- Select Assignee --</option>
                {uniqueTailors.map((tailor: any) => (
                  <option key={tailor} value={tailor}>{tailor}</option>
                ))}
              </select>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setShareMode('menu')}>Back</button>
                <button 
                  className="btn btn-primary" 
                  disabled={!selectedShareTailor}
                  onClick={() => {
                    const filtered = components.filter(c => c.internal_team?.full_name === selectedShareTailor);
                    handleGenerateWaMessage(filtered);
                  }}
                >
                  Generate Preview
                </button>
              </div>
            </div>
          )}

          {shareMode === 'preview' && (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Review and edit the message below before sending it manually through WhatsApp.
              </p>
              <textarea 
                className="input" 
                style={{ 
                  width: '100%', 
                  height: '400px', 
                  fontFamily: 'monospace', 
                  fontSize: '0.85rem', 
                  padding: '1rem', 
                  lineHeight: '1.5',
                  resize: 'none'
                }}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                <button className="btn btn-outline" onClick={() => setShareMode('menu')}>Back to Options</button>
                <button className="btn btn-primary" style={{ background: '#25D366', color: 'white' }} onClick={shareViaWhatsApp}>
                  <MessageCircle size={16} style={{ marginRight: '6px' }} /> Open WhatsApp
                </button>
              </div>
            </>
          )}

        </div>
      </Modal>

      {/* Sourcing Modal */}
      <Modal 
        isOpen={isSourcingModalOpen} 
        onClose={() => {
          setIsSourcingModalOpen(false);
          fetchProductionBoard(); // Refresh board to pick up any changes made inside modal
        }} 
        title={`Sourcing & Dyeing for ${activeOutfit?.outfit_name || ''}`}
      >
        {activeOutfit && (
          <div style={{ height: '100%', maxHeight: '80vh', overflowY: 'auto', paddingBottom: '1rem' }}>
            <FabricAndDyeingTab orderId={activeOutfit.orders?.id || ''} outfits={[activeOutfit]} viewMode={sourcingViewMode} />
          </div>
        )}
      </Modal>
      {/* Tailor Assignment Modal */}
      <Modal 
        isOpen={isAssignModalOpen} 
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssignDropComponent(null);
          setDraggedItem(null);
        }} 
        title="Assign Master / Tailor"
      >
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            <p>You are moving <strong>{assignDropComponent?.component_name}</strong> to <strong>{assignTargetStatus.replace(/_/g, ' ').toUpperCase()}</strong>.</p>
            <p style={{ marginTop: '0.5rem' }}>Please select the Master/Tailor responsible for this stage.</p>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Assign To *
            </label>
            <select 
              className="input" 
              style={{ width: '100%', padding: '0.6rem' }} 
              value={assignTailorId} 
              onChange={e => setAssignTailorId(e.target.value)} 
            >
              <option value="">-- Unassigned --</option>
              {allTailorsList.map((tailor: any) => (
                <option key={tailor.id} value={tailor.id}>{tailor.full_name} ({tailor.role})</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            <button 
              className="btn btn-outline" 
              onClick={() => {
                setIsAssignModalOpen(false);
                setAssignDropComponent(null);
                setDraggedItem(null);
              }}
            >
              Cancel Move
            </button>
            <button 
              className="btn btn-primary" 
              onClick={confirmAssignDrop}
              disabled={!assignTailorId}
            >
              Confirm Assignment
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
