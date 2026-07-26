import React from 'react';
import { FolderUp, RefreshCw, Trash2 } from 'lucide-react';
import { Statement } from '../types';
import { api } from '../services/api';

interface StatementsPageProps {
  statements: Statement[];
  onOpenUpload: () => void;
  onRefresh: () => void;
  onRefreshDashboard: () => void;
}

export const StatementsPage: React.FC<StatementsPageProps> = ({
  statements,
  onOpenUpload,
  onRefresh,
  onRefreshDashboard,
}) => {
  const handleDelete = async (statementId: string) => {
    if (confirm('Are you sure you want to delete this statement and its transactions?')) {
      try {
        await api.statements.delete(statementId);
        onRefresh();
        onRefreshDashboard();
      } catch {
        alert('Failed to delete statement');
      }
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Statements History</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Upload history and parser queue logs</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={onOpenUpload} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <FolderUp size={14} /> Upload
          </button>
          <button className="btn-secondary" onClick={onRefresh} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {statements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>No statements uploaded yet.</p>
          <button className="btn-primary" onClick={onOpenUpload} style={{ margin: '0 auto' }}>
            Upload Your First Statement
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date Uploaded</th>
                <th>Filename</th>
                <th>Bank</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {statements.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{s.fileName}</td>
                  <td>{s.bankName}</td>
                  <td>
                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: 
                          s.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : 
                          s.status === 'PROCESSING' ? 'rgba(14,165,233,0.1)' : 
                          s.status === 'FAILED' ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.03)',
                        color: 
                          s.status === 'COMPLETED' ? 'var(--success)' : 
                          s.status === 'PROCESSING' ? 'var(--accent-cyan)' : 
                          s.status === 'FAILED' ? 'var(--danger)' : 'var(--text-secondary)'
                      }}
                    >
                      {s.status}
                    </span>
                    {s.errorMessage && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', wordBreak: 'break-word' }}>
                        Error: {s.errorMessage}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-icon"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleDelete(s.id)}
                      title="Delete Statement"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
