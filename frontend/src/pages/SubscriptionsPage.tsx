import React from 'react';
import { CreditCard, Calendar, Info } from 'lucide-react';
import { Transaction } from '../types';

interface SubscriptionsPageProps {
  subscriptions: Transaction[];
  subLoading: boolean;
}

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({
  subscriptions,
  subLoading,
}) => {
  // Calculate subscription metrics
  const uniqueSubs = new Map<string, number>();
  subscriptions.forEach(s => {
    const key = s.description.toLowerCase();
    const currentVal = uniqueSubs.get(key) || 0;
    if (s.amount > currentVal) {
      uniqueSubs.set(key, s.amount);
    }
  });
  const monthlyTotal = Array.from(uniqueSubs.values()).reduce((sum, amt) => sum + amt, 0);
  const activeCount = uniqueSubs.size;

  return (
    <div>
      {/* Metrics Cards */}
      <section className="sub-grid">
        <div className="glass-card stat-card" style={{ minHeight: '140px' }}>
          <div>
            <div className="stat-icon" style={{ color: 'var(--accent-pink)', background: 'rgba(236, 72, 153, 0.08)' }}>
              <CreditCard size={22} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Active Subscriptions</p>
          </div>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0', fontFamily: 'Outfit' }}>
              {activeCount}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Unique recurring services detected</p>
          </div>
        </div>

        <div className="glass-card stat-card" style={{ minHeight: '140px' }}>
          <div>
            <div className="stat-icon" style={{ color: 'var(--accent-pink)', background: 'rgba(168, 85, 247, 0.08)' }}>
              <Calendar size={22} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Monthly Spend Est.</p>
          </div>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0', fontFamily: 'Outfit', color: 'var(--accent-pink)' }}>
              ₹{(monthlyTotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Annualized: ₹{((monthlyTotal * 12) / 100).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="glass-card sub-info-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Info size={24} style={{ color: 'var(--accent-cyan)' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            <strong>AI Detection Rule</strong>: Our parser categorizes recurring items, subscriptions, and SaaS payments based on payment frequency and transactional descriptions. Correct any misclassifications below by reassigning their category.
          </p>
        </div>
      </section>

      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>Recurring Bills Registry</h3>
        {subLoading ? (
          <div className="skeleton-loader">
            <div className="skeleton-line" style={{ height: '3rem' }}></div>
          </div>
        ) : subscriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No active recurring subscriptions detected.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Upload statements with recurring payments or check the subscription box when manually logging expenses.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service Description</th>
                  <th>Category</th>
                  <th>Last Billing Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.description}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: (s.category?.color || '#6366f1') + '15', color: s.category?.color }}>
                        {s.category?.name || 'Subscriptions'}
                      </span>
                    </td>
                    <td>{new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-pink)' }}>
                      ₹{(Number(s.amount) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
