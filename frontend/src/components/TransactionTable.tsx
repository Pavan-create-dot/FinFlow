import React from 'react';
import { Transaction } from '../types';

export const TransactionTable: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  return (
    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
      <h3 style={{ marginBottom: '1.5rem' }}>Recent Transactions</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ minWidth: '100px', width: '15%' }}>Date</th>
              <th style={{ minWidth: '180px', width: '40%' }}>Description</th>
              <th style={{ minWidth: '120px', width: '30%' }}>Category</th>
              <th style={{ minWidth: '120px', width: '15%', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td style={{ minWidth: '100px' }}>{new Date(t.date).toLocaleDateString()}</td>
                <td style={{ minWidth: '180px' }}>
                  <div style={{ fontWeight: '500', wordBreak: 'break-word' }}>{t.description}</div>
                </td>
                <td style={{ minWidth: '120px' }}>
                  <span className="badge" style={{ backgroundColor: t.category?.color + '20', color: t.category?.color }}>
                    {t.category?.name || 'Uncategorized'}
                  </span>
                </td>
                <td style={{ minWidth: '120px', textAlign: 'right', fontWeight: 'bold', color: t.type === 'EXPENSE' ? 'var(--danger)' : 'var(--success)' }}>
                  {t.type === 'EXPENSE' ? '-' : '+'}₹{(Number(t.amount) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
