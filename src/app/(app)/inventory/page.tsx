'use client';
import { useState } from 'react';
import { Package, Truck, Layers, Zap, Cpu, Plus, Search } from 'lucide-react';
import styles from './inventory.module.css';

export default function InventoryAddonPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const fabrics = [
    { id: 1, name: 'Banarasi Silk (Gold)', sku: 'SILK-BN-001', stock: '45m', status: 'normal', supplier: 'Varanasi Weavers', style: styles.silk },
    { id: 2, name: 'Maroon Velvet', sku: 'VEL-MR-005', stock: '8m', status: 'low', supplier: 'Ludhiana Textiles', style: styles.velvet },
    { id: 3, name: 'Silver Zari Thread', sku: 'ZRI-SL-002', stock: '12kg', status: 'normal', supplier: 'Surat Zari Mills', style: styles.zari },
    { id: 4, name: 'Ivory Georgette', sku: 'GEO-IV-004', stock: '55m', status: 'normal', supplier: 'Surat Textiles', style: styles.georgette }
  ];

  const filteredFabrics = fabrics.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Fabric Inventory
          <span className={styles.addonBadge}>Add-on</span>
        </h1>
        <button className="btn btn-primary">
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Log Shipment
        </button>
      </div>

      <div style={{ marginBottom: '2rem', maxWidth: '400px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search inventory SKU or fabric name..." 
            className="input"
            style={{ width: '100%', paddingLeft: '3rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.inventoryGrid}>
        {filteredFabrics.length > 0 ? (
          filteredFabrics.map(fabric => (
            <div key={fabric.id} className={styles.fabricCard}>
              <div className={`${styles.fabricImage} ${fabric.style}`}>
                <Layers size={40} opacity={0.2} strokeWidth={1} />
                <span className={`${styles.stockBadge} ${fabric.status === 'low' ? styles.stockLow : ''}`}>
                  {fabric.stock} Available
                </span>
              </div>
              
              <div className={styles.fabricDetails}>
                <div className={styles.fabricTitle}>{fabric.name}</div>
                <div className={styles.fabricMeta}>
                  <span>SKU: {fabric.sku}</span>
                </div>
                
                <div className={styles.supplierRow}>
                  <Truck size={14} />
                  {fabric.supplier}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            No matching fabric found in inventory.
          </div>
        )}
      </div>

      {/* Another Add-on Showcase: AI Estimator */}
      <div className={styles.aiSection}>
        <div className={styles.aiIconBox}>
          <Cpu size={32} />
        </div>
        <div className={styles.aiContent}>
          <div className={styles.aiTitle}>
            AI Production Time Estimator
            <span className={styles.addonBadge} style={{ background: '#000', color: '#fff' }}>Pro Add-on</span>
          </div>
          <p className={styles.aiDesc}>
            Analyze historical production timelines across 500+ past orders to automatically predict completion dates and detect bottleneck risks in the current design sketch before production begins.
          </p>
          <div className={styles.aiAction}>
            <button className="btn btn-primary" style={{ background: '#000', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Zap size={16} color="#cba876" fill="#cba876" /> Run Prediction Model
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status: Active • Auto-runs on new orders</span>
          </div>
        </div>
      </div>
    </div>
  );
}
