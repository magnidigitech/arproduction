'use client';
import { useState, useEffect } from 'react';
import { Settings, Users, Truck, Plus, Edit, Trash2, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import styles from './settings.module.css';
import { supabase } from '@/lib/supabase';
import Modal from '@/core/components/Modal';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('vendors');
  const [vendors, setVendors] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Vendor Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [vendorForm, setVendorForm] = useState({ name: '', type: 'fabric', contact_person: '', phone: '', email: '', address: '', notes: '' });

  // Team Modal State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [teamForm, setTeamForm] = useState({ full_name: '', role: 'tailor', phone: '', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vendorsRes, teamRes] = await Promise.all([
        supabase.from('vendors').select('*').order('name'),
        supabase.from('internal_team').select('*').order('full_name')
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      if (teamRes.error) throw teamRes.error;

      setVendors(vendorsRes.data || []);
      setTeam(teamRes.data || []);
    } catch (error: any) {
      console.error('Error fetching settings data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Vendor Handlers
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        const { error } = await supabase.from('vendors').update(vendorForm).eq('id', editingVendor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vendors').insert(vendorForm);
        if (error) throw error;
      }
      setIsVendorModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const openAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({ name: '', type: 'fabric', contact_person: '', phone: '', email: '', address: '', notes: '' });
    setIsVendorModalOpen(true);
  };

  const openEditVendor = (vendor: any) => {
    setEditingVendor(vendor);
    setVendorForm({ 
      name: vendor.name || '', 
      type: vendor.type || 'fabric', 
      contact_person: vendor.contact_person || '', 
      phone: vendor.phone || '', 
      email: vendor.email || '', 
      address: vendor.address || '', 
      notes: vendor.notes || '' 
    });
    setIsVendorModalOpen(true);
  };

  // Team Handlers
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        const { error } = await supabase.from('internal_team').update(teamForm).eq('id', editingTeam.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('internal_team').insert(teamForm);
        if (error) throw error;
      }
      setIsTeamModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;
    try {
      const { error } = await supabase.from('internal_team').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const openAddTeam = () => {
    setEditingTeam(null);
    setTeamForm({ full_name: '', role: 'tailor', phone: '', notes: '' });
    setIsTeamModalOpen(true);
  };

  const openEditTeam = (member: any) => {
    setEditingTeam(member);
    setTeamForm({ 
      full_name: member.full_name || '', 
      role: member.role || 'tailor', 
      phone: member.phone || '', 
      notes: member.notes || '' 
    });
    setIsTeamModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    'admin': 'var(--error)',
    'designer': 'var(--primary)',
    'tailor': 'var(--success)',
    'manager': 'var(--warning)',
    'master_cutter': '#8B5CF6'
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Settings size={24} color="white" />
        </div>
        <div>
          <h1 className={styles.title}>System Settings</h1>
          <p className={styles.subtitle}>Manage your vendors, team members, and configuration.</p>
        </div>
      </div>
 
      <div className={styles.tabs}>
        <button 
          onClick={() => setActiveTab('vendors')}
          className={`${styles.tabBtn} ${activeTab === 'vendors' ? styles.tabActive : ''}`}
        >
          <Truck size={18} /> Suppliers & Vendors
        </button>
        <button 
           onClick={() => setActiveTab('team')}
           className={`${styles.tabBtn} ${activeTab === 'team' ? styles.tabActive : ''}`}
        >
          <Users size={18} /> Team Data (Tailors)
        </button>
      </div>
 
      <div className={styles.settingsContent}>
        {activeTab === 'vendors' && (
          <div>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Vendor Directory</h2>
                <p className={styles.sectionSubtitle}>Fabric suppliers, dyers, and external partners.</p>
              </div>
              <button className="btn btn-primary" style={{ gap: '0.5rem' }} onClick={openAddVendor}>
                <Plus size={16} /> Add Vendor
              </button>
            </div>
 
            {vendors.length > 0 ? (
              <div className={styles.vendorGrid}>
                {vendors.map((vendor) => (
                  <div key={vendor.id} className={styles.vendorCard}>
                    <div className={styles.vendorCardHeader}>
                      <div>
                        <h3 className={styles.vendorName}>{vendor.name}</h3>
                        <span className={`${styles.vendorBadge} ${vendor.type === 'fabric' ? styles.badgeFabric : styles.badgeDyeing}`}>
                          {vendor.type}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => openEditVendor(vendor)}><Edit size={14} /></button>
                        <button className="btn btn-outline" style={{ padding: '0.25rem', color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => handleDeleteVendor(vendor.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
 
                    <div className={styles.vendorInfo}>
                      {vendor.contact_person && <div className={styles.infoRow}><Users size={14} /> <span>{vendor.contact_person}</span></div>}
                      {vendor.phone && <div className={styles.infoRow}><Phone size={14} /> <span>{vendor.phone}</span></div>}
                      {vendor.email && <div className={styles.infoRow}><Mail size={14} /> <span>{vendor.email}</span></div>}
                      {vendor.address && <div className={styles.infoRow}><MapPin size={14} /> <span>{vendor.address}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Truck size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No Vendors Found</h3>
                <p className={styles.emptySubtitle}>Start adding your fabric suppliers and dyers to integrate them into orders.</p>
              </div>
            )}
          </div>
        )}
 
        {activeTab === 'team' && (
          <div>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Internal Team & Tailors</h2>
                <p className={styles.sectionSubtitle}>Manage your production staff, master cutters, and tailors.</p>
              </div>
              <button className="btn btn-primary" style={{ gap: '0.5rem' }} onClick={openAddTeam}>
                <Plus size={16} /> Add Team Member
              </button>
            </div>
 
            {team.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.teamTable}>
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>System Role</th>
                      <th>Phone</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((member) => (
                      <tr key={member.id}>
                        <td data-label="Name">
                          <div className={styles.teamMemberCell}>
                             <div className={styles.teamAvatar}>
                               {(member.full_name || 'U')[0]}
                             </div>
                             {member.full_name}
                          </div>
                        </td>
                        <td data-label="Role">
                           <span className={styles.roleBadge} style={{ 
                             background: `color-mix(in srgb, ${roleColors[member.role] || 'var(--primary)'} 15%, transparent)`,
                             color: roleColors[member.role] || 'var(--primary)'
                           }}>
                             {member.role ? member.role.replace('_', ' ') : 'Tailor'}
                           </span>
                        </td>
                        <td data-label="Phone">
                          {member.phone || '-'}
                        </td>
                        <td data-label="Actions" style={{ textAlign: 'right' }}>
                          <div className={styles.actionButtons}>
                            <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => openEditTeam(member)}><Edit size={14} /></button>
                            <button className="btn btn-outline" style={{ padding: '0.25rem', color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => handleDeleteTeam(member.id)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Users size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No Team Members</h3>
                <p className={styles.emptySubtitle}>Add your tailors and staff to assign them to production tasks.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vendor Modal */}
      <Modal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} title={editingVendor ? "Edit Vendor" : "Add New Vendor"}>
        <form onSubmit={handleSaveVendor} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Company Name *</label>
              <input required type="text" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }} value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} placeholder="e.g. Ramesh Silk Mills" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Vendor Type *</label>
              <select style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }} value={vendorForm.type} onChange={e => setVendorForm({...vendorForm, type: e.target.value})}>
                <option value="fabric">Fabric Supplier</option>
                <option value="dyeing">Dyeing Vendor</option>
                <option value="other">Other Service</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Contact Person</label>
               <input type="text" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }} value={vendorForm.contact_person} onChange={e => setVendorForm({...vendorForm, contact_person: e.target.value})} placeholder="e.g. Ramesh" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Phone Number</label>
               <input type="tel" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }} value={vendorForm.phone} onChange={e => setVendorForm({...vendorForm, phone: e.target.value})} placeholder="+91 99999 99999" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email Address</label>
             <input type="email" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }} value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} placeholder="ramesh@example.com" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Physical Address</label>
               <textarea style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)', minHeight: '80px', resize: 'vertical' }} value={vendorForm.address} onChange={e => setVendorForm({...vendorForm, address: e.target.value})} placeholder="Shop 12, Main Street..." />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Internal Notes</label>
               <textarea style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)', minHeight: '80px', resize: 'vertical' }} value={vendorForm.notes} onChange={e => setVendorForm({...vendorForm, notes: e.target.value})} placeholder="Fast shipping, poor dye matching..." />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsVendorModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingVendor ? 'Update Vendor' : 'Save Vendor'}</button>
          </div>
        </form>
      </Modal>

      {/* Team Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title={editingTeam ? "Edit Team Member" : "Add Team Member"}>
        <form onSubmit={handleSaveTeam} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Full Name *</label>
              <input required type="text" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }} value={teamForm.full_name} onChange={e => setTeamForm({...teamForm, full_name: e.target.value})} placeholder="e.g. Sarah Connor" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Role *</label>
              <select style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }} value={teamForm.role} onChange={e => setTeamForm({...teamForm, role: e.target.value})}>
                <option value="tailor">Tailor</option>
                <option value="master_cutter">Master Cutter</option>
                <option value="manager">Manager</option>
                <option value="designer">Designer</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Phone Number</label>
             <input type="tel" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }} value={teamForm.phone} onChange={e => setTeamForm({...teamForm, phone: e.target.value})} placeholder="+91 99999 99999" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Internal Notes</label>
             <textarea style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)', minHeight: '80px', resize: 'vertical' }} value={teamForm.notes} onChange={e => setTeamForm({...teamForm, notes: e.target.value})} placeholder="Special skills, schedule..." />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsTeamModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingTeam ? 'Update Member' : 'Save Member'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
