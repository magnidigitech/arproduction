'use client';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Scissors,
  Palette,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Package,
  Layers,
  CreditCard,
  Menu,
  X,
  Loader2,
  ExternalLink
} from 'lucide-react';
import styles from './dashboard.module.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ customers: any[], orders: any[] }>({ customers: [], orders: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Close search results on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults({ customers: [], orders: [] });
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      // 1. Search customers by name or phone
      const customersPromise = supabase
        .from('customers')
        .select('id, full_name, phone')
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(5);

      // 2. Search orders by order number directly
      const ordersByNumberPromise = supabase
        .from('orders')
        .select('id, order_number, status, priority, created_at, customers (id, full_name, phone)')
        .ilike('order_number', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(5);

      // 3. Search orders by customer name OR phone
      const ordersByCustomerPromise = supabase
        .from('orders')
        .select('id, order_number, status, priority, created_at, customers!inner (id, full_name, phone)')
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`, { foreignTable: 'customers' })
        .order('created_at', { ascending: false })
        .limit(5);

      const [customersRes, ordersNumRes, ordersCustRes] = await Promise.all([
        customersPromise,
        ordersByNumberPromise,
        ordersByCustomerPromise
      ]);

      // Merge and deduplicate orders
      const mergedOrdersMap = new Map();
      (ordersNumRes.data || []).forEach(o => mergedOrdersMap.set(o.id, o));
      (ordersCustRes.data || []).forEach(o => mergedOrdersMap.set(o.id, o));

      const distinctOrders = Array.from(mergedOrdersMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      // Ensure customers from matched orders are also in the customers list
      const mergedCustomersMap = new Map();
      (customersRes.data || []).forEach(c => mergedCustomersMap.set(c.id, c));

      // If we searched by order ID, the associated customer should also show up
      distinctOrders.forEach(o => {
        if (o.customers && !mergedCustomersMap.has(o.customers.id)) {
          mergedCustomersMap.set(o.customers.id, o.customers);
        }
      });

      setSearchResults({
        customers: Array.from(mergedCustomersMap.values()).slice(0, 5),
        orders: distinctOrders
      });
    } catch (error) {
      console.error('Global search catch error:', error);
      setSearchResults({ customers: [], orders: [] });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className={styles.overlay} onClick={closeSidebar} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <Link href="/dashboard" className={styles.logo}>
          <img
            src="/images/logo.png"
            alt="Anusha Reddy Couture"
            style={{ width: '100%', height: 'auto', maxWidth: '180px' }}
          />
        </Link>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`} onClick={closeSidebar}>
            <LayoutDashboard className={styles.navItemIcon} />
            Dashboard
          </Link>
          <Link href="/customers" className={`${styles.navItem} ${pathname === '/customers' ? styles.active : ''}`} onClick={closeSidebar}>
            <Users className={styles.navItemIcon} />
            Customers
          </Link>
          <Link href="/orders" className={`${styles.navItem} ${pathname.startsWith('/orders') ? styles.active : ''}`} onClick={closeSidebar}>
            <Scissors className={styles.navItemIcon} />
            Orders & Outfits
          </Link>
          <Link href="/production" className={`${styles.navItem} ${pathname === '/production' ? styles.active : ''}`} onClick={closeSidebar}>
            <Layers className={styles.navItemIcon} />
            Kanban Board
          </Link>
          <Link href="/payments" className={`${styles.navItem} ${pathname === '/payments' ? styles.active : ''}`} onClick={closeSidebar}>
            <CreditCard className={styles.navItemIcon} />
            Payment Ledger
          </Link>
          <Link href="/design" className={`${styles.navItem} ${pathname === '/design' ? styles.active : ''}`} onClick={closeSidebar}>
            <Palette className={styles.navItemIcon} />
            Design Board
          </Link>
          <Link href="/inventory" className={`${styles.navItem} ${pathname === '/inventory' ? styles.active : ''}`} onClick={closeSidebar}>
            <Package className={styles.navItemIcon} />
            Add-on: Inventory
          </Link>
          <Link href="/settings" className={`${styles.navItem} ${pathname === '/settings' ? styles.active : ''}`} onClick={closeSidebar}>
            <Settings className={styles.navItemIcon} />
            Settings
          </Link>
        </nav>

        <div className={styles.userSection}>
          <div className={styles.avatar}>A</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Admin User</span>
            <span className={styles.userRole}>Studio Manager</span>
          </div>
          <ChevronDown size={16} className={styles.navItemIcon} style={{ marginLeft: 'auto' }} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Top Header */}
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <button className={styles.menuBtn} onClick={toggleSidebar} aria-label="Toggle Menu">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className={styles.headerTitle}>Overview</div>
          </div>

          <div className={styles.headerSearchArea}>
            <div className={styles.globalSearchContainer} ref={searchRef}>
              <div className={styles.searchWrapper}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search order ID, name, or phone..."
                  className={styles.globalSearchInput}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                />
                {isSearching && <Loader2 size={16} className={`${styles.searchIcon} animate-spin`} style={{ right: '0.75rem', left: 'auto' }} />}
              </div>

              {showResults && (
                <div className={styles.searchResultsDropdown}>
                  {searchResults.customers.length === 0 && searchResults.orders.length === 0 && !isSearching ? (
                    <div className={styles.noResults}>No results found for "{searchQuery}"</div>
                  ) : (
                    <>
                      {searchResults.customers.length > 0 && (
                        <div className={styles.searchSection}>
                          <div className={styles.searchSectionTitle}>Customers</div>
                          {searchResults.customers.map(c => (
                            <Link
                              key={c.id}
                              href={`/customers/${c.id}`}
                              className={styles.searchResultItem}
                              onClick={() => { setShowResults(false); setSearchQuery(''); }}
                            >
                              <div className={styles.resultMain}>
                                <span className={styles.resultTitle}>{c.full_name}</span>
                                <span className={styles.resultSubtitle}>{c.phone}</span>
                              </div>
                              <ExternalLink size={14} className={styles.resultArrow} />
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchResults.orders.length > 0 && (
                        <div className={styles.searchSection}>
                          <div className={styles.searchSectionTitle}>Orders</div>
                          {searchResults.orders.map(o => (
                            <Link
                              key={o.id}
                              href={`/orders/${o.id}`}
                              className={styles.searchResultItem}
                              onClick={() => { setShowResults(false); setSearchQuery(''); }}
                            >
                              <div className={styles.resultMain}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <span className={styles.resultTitle}>{o.order_number}</span>
                                  {o.status && (
                                    <span className={`${styles.statusBadge} ${(() => {
                                      const s = o.status.toLowerCase().replace(/ /g, '_');
                                      const map: any = {
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
                                      return map[s] || styles.statusInquiry;
                                    })()}`}>
                                      {o.status}
                                    </span>
                                  )}
                                  {o.priority && (
                                    <span className={`${styles.priorityBadge} ${styles[o.priority.toLowerCase()]}`}>
                                      {o.priority}
                                    </span>
                                  )}
                                </div>
                                <span className={styles.resultSubtitle}>Customer: {o.customers?.full_name}</span>
                              </div>
                              <ExternalLink size={14} className={styles.resultArrow} />
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.iconBtn} aria-label="Notifications">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Page Content injected here */}
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
