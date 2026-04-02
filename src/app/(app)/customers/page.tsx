'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Filter, ArrowUpDown, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './customers.module.css';
import Modal from '@/core/components/Modal';
import AddCustomerForm from '@/modules/customers/components/AddCustomerForm';

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`*, orders(count)`)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const query = searchQuery.toLowerCase();
    return (
      (customer.full_name || '').toLowerCase().includes(query) ||
      (customer.phone || '').includes(searchQuery) ||
      (customer.email || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Customers</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Add Customer
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Customer">
        <AddCustomerForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchCustomers();
          }} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by name, phone, or email..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <button className={styles.filterBtn}>
            <Filter size={16} />
            Filter
          </button>
          <button className={styles.filterBtn}>
            <ArrowUpDown size={16} />
            Sort
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div className={styles.customersGrid}>
          {filteredCustomers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              {customers.length === 0 ? 'No customers found. Click "Add Customer" to get started.' : 'No matching customers found.'}
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <a key={customer.id} href={`/customers/${customer.id}`} className={styles.customerCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    {customer.full_name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className={styles.customerInfo}>
                    <span className={styles.customerName}>{customer.full_name}</span>
                    <span className={styles.customerType}>{customer.type || 'Standard'}</span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <Phone size={16} />
                    <span>{customer.phone || 'No phone'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <Mail size={16} />
                    <span>{customer.email || 'No email'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <MapPin size={16} />
                    <span>{customer.location || 'No location'}</span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span><span className={styles.statsHighlight}>{customer.orders?.[0]?.count || 0}</span> Active Orders</span>
                  <span>Joined: {new Date(customer.created_at).toLocaleDateString()}</span>
                </div>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}

