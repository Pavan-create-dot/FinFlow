import React, { useState } from 'react';
import { api } from '../services/api';
import { Category } from '../types';

interface AddTransactionModalProps {
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ categories, onClose, onSuccess }) => {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSubscription, setIsSubscription] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) {
      setError('Please fill in description and amount.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setSubmitting(true);
    setError('');

    // Convert Rupees/Cents to paise (integer)
    const amountInPaise = Math.round(numericAmount * 100);

    try {
      await api.transactions.create({
        type,
        date,
        amount: amountInPaise,
        description,
        merchantName: merchantName.trim() || undefined,
        categoryId: categoryId || null,
        isSubscription,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content">
        <h3 style={{ marginBottom: '1rem' }}>Log Transaction Manually</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Record an income or expense transaction manually.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Transaction Type</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: type === 'EXPENSE' ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.02)', border: type === 'EXPENSE' ? '1px solid var(--danger)' : '1px solid var(--glass-border)', color: type === 'EXPENSE' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                <input 
                  type="radio" 
                  name="type" 
                  checked={type === 'EXPENSE'} 
                  onChange={() => setType('EXPENSE')}
                  style={{ accentColor: 'var(--danger)' }}
                />
                Expense
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: type === 'INCOME' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: type === 'INCOME' ? '1px solid var(--success)' : '1px solid var(--glass-border)', color: type === 'INCOME' ? 'var(--success)' : 'var(--text-secondary)' }}>
                <input 
                  type="radio" 
                  name="type" 
                  checked={type === 'INCOME'} 
                  onChange={() => setType('INCOME')}
                  style={{ accentColor: 'var(--success)' }}
                />
                Income
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="tx-date">Date</label>
              <input 
                id="tx-date"
                type="date" 
                className="form-input" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="tx-amount">Amount (₹)</label>
              <input 
                id="tx-amount"
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                className="form-input" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tx-description">Description</label>
            <input 
              id="tx-description"
              type="text" 
              placeholder="e.g. Grocery shopping" 
              className="form-input" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="tx-merchant">Merchant Name (Optional)</label>
              <input 
                id="tx-merchant"
                type="text" 
                placeholder="e.g. DMart" 
                className="form-input" 
                value={merchantName} 
                onChange={e => setMerchantName(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label htmlFor="tx-category">Category</label>
              <select 
                id="tx-category"
                className="form-input" 
                value={categoryId} 
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">Uncategorized</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ margin: '1rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={isSubscription} 
                onChange={e => setIsSubscription(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              Is this a recurring subscription?
            </label>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={submitting}
              style={{ flex: 2, justifyContent: 'center' }}
            >
              {submitting ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
