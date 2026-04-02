'use client';
import { useState, useEffect } from 'react';
import { Activity, Scissors, Users, IndianRupee, ArrowUpRight, ArrowDownRight, Clock, Box, PlusCircle, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '../dashboard.module.css';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeOrders: 0,
    upcomingDeadlines: 0,
    pendingReceivables: 0,
    productionItems: 0,
  });

  const [urgentOrders, setUrgentOrders] = useState<any[]>([]);
  const [productionCounts, setProductionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, estimated_amount, final_amount, deadline, priority,
          customers(full_name)
        `)
        .not('status', 'in', '("completed","cancelled")');

      if (ordersError) throw ordersError;

      // 2. Fetch Outfit Components
      const { data: componentsData, error: componentsError } = await supabase
        .from('outfit_components')
        .select(`
          id, status, component_name,
          outfits(outfit_name, orders(order_number, deadline, status))
        `);

      if (componentsError) throw componentsError;

      // Calculate Metrics
      const activeOrders = ordersData || [];
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);

      let upcoming = 0;
      let receivables = 0;

      activeOrders.forEach(order => {
        if (order.deadline) {
          const deadlineDate = new Date(order.deadline);
          if (deadlineDate >= now && deadlineDate <= nextWeek) {
            upcoming++;
          } else if (deadlineDate < now) {
            upcoming++; // Count overdue as upcoming/urgent too
          }
        }

        const total = Number(order.estimated_amount) || 0;
        const advance = Number(order.final_amount) || 0;
        receivables += (total - advance);
      });

      const components = componentsData || [];
      const activeComponents = components.filter(c =>
        c.status && c.status !== 'pending' && c.status !== 'ready' && (c.outfits as any)?.orders?.status !== 'completed' && (c.outfits as any)?.orders?.status !== 'cancelled'
      );

      setMetrics({
        activeOrders: activeOrders.length,
        upcomingDeadlines: upcoming,
        pendingReceivables: receivables,
        productionItems: activeComponents.length
      });

      // Calculate Production Breakdown
      const counts: Record<string, number> = {
        'Sourcing': 0,
        'Pattern & Cutting': 0,
        'Embroidery': 0,
        'Stitching & Finishing': 0
      };

      activeComponents.forEach(c => {
        if (c.status === 'fabric_sourcing' || c.status === 'dyeing') counts['Sourcing']++;
        else if (c.status === 'pattern_making' || c.status === 'cutting') counts['Pattern & Cutting']++;
        else if (c.status === 'embroidery') counts['Embroidery']++;
        else if (c.status === 'stitching' || c.status === 'finishing') counts['Stitching & Finishing']++;
      });
      setProductionCounts(counts);

      // Get Urgent Orders (Sorted by deadline)
      const sortedOrders = [...activeOrders].sort((a: any, b: any) => {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      }).slice(0, 5); // Top 5

      setUrgentOrders(sortedOrders);

    } catch (error: any) {
      console.error("Error fetching dashboard data:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Activity className="animate-pulse" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className={styles.headerTitle} style={{ fontSize: '1.75rem' }}>Dashboard Overview</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/production" className="btn btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Scissors size={16} /> Live Kanban
          </Link>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {/* Active Orders Stat */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>My Orders</span>
            <div className={styles.statIcon}><Box size={20} /></div>
          </div>
          <div className={styles.statValue}>{metrics.activeOrders}</div>
          <div className={styles.statChange}>
            <span style={{ color: 'var(--text-muted)' }}>Currently in progress</span>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Due ≤ 7 Days</span>
            <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}><AlertCircle size={20} /></div>
          </div>
          <div className={styles.statValue}>{metrics.upcomingDeadlines}</div>
          <div className={styles.statChange}>
            <span style={{ color: 'var(--error)', fontWeight: 500 }}>High Priority Attention</span>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Pending Receivables</span>
            <div className={styles.statIcon}><IndianRupee size={20} /></div>
          </div>
          <div className={styles.statValue}>₹{metrics.pendingReceivables.toLocaleString('en-IN')}</div>
          <div className={styles.statChange}>
            <span style={{ color: 'var(--text-muted)' }}>Remaining balances</span>
          </div>
        </div>

        {/* Production Items */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Items in Production</span>
            <div className={styles.statIcon} style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0EA5E9' }}><Scissors size={20} /></div>
          </div>
          <div className={styles.statValue}>{metrics.productionItems}</div>
          <div className={styles.statChange}>
            <span style={{ color: 'var(--text-muted)' }}>Active assembly components</span>
          </div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Main Section - Priority Orders */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Urgent Orders</h2>
            <Link href="/orders" className={styles.sectionAction}>View All Orders →</Link>
          </div>

          <div className={styles.itemList}>
            {urgentOrders.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active orders.</div>
            ) : urgentOrders.map(order => {
              const isOverdue = order.deadline && new Date(order.deadline).getTime() < new Date().getTime();

              return (
                <Link href={`/orders/${order.id}`} key={order.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className={styles.itemRow}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemAvatar} style={{ background: isOverdue ? 'var(--error)' : 'var(--border)', color: isOverdue ? 'white' : 'var(--text-muted)' }}>
                        <AlertCircle size={18} />
                      </div>
                      <div className={styles.itemDetails}>
                        <span className={styles.itemName}>{order.order_number} - {order.customers?.full_name}</span>
                        <span className={styles.itemMeta} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: isOverdue ? 'var(--error)' : 'var(--text-muted)' }}>
                          <Calendar size={12} /> {order.deadline ? new Date(order.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Deadline'}
                          {isOverdue && <span style={{ fontWeight: 'bold' }}>(OVERDUE)</span>}
                        </span>
                      </div>
                    </div>
                    <span className={`${styles.itemStatus} ${order.status === 'production' ? styles.statusProduction : styles.statusReview}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Secondary Section - Production Breakdown */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Production Load</h2>
            <Link href="/production" className={styles.sectionAction}>Board →</Link>
          </div>

          <div className={styles.itemList}>
            {Object.entries(productionCounts).map(([stage, count]) => (
              <div key={stage} className={styles.itemRow} style={{ padding: '1rem' }}>
                <div className={styles.itemInfo}>
                  <div className={styles.itemDetails}>
                    <span className={styles.itemName}>{stage}</span>
                  </div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{count}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
