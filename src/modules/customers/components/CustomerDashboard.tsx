'use client';

import React, { useEffect, useState } from 'react';
import styles from './CustomerDashboard.module.css';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function CustomerDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setCustomers(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Customers</h1>
          <p>Manage clientele, measurements, and preferences.</p>
        </div>
        <button className={`btn btn-primary ${styles.addButton}`}>+ Add Customer</button>
      </header>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.loader}>Loading...</div>
        ) : customers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👤</div>
            <h3>No customers found</h3>
            <p>Start by adding your first couture client.</p>
            <button className="btn btn-primary">+ Add Client</button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.clientName}>
                        <div className={styles.avatar}>{c.first_name[0]}{c.last_name[0]}</div>
                        {c.first_name} {c.last_name}
                      </div>
                    </td>
                    <td>{c.email || '-'}</td>
                    <td>{c.phone || '-'}</td>
                    <td>
                      <button className={styles.actionBtn}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
