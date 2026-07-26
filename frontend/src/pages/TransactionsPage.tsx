import React from 'react';
import { Transaction, Category } from '../types';

interface TransactionsPageProps {
  transactions: Transaction[];
  categories: Category[];
  txLoading: boolean;
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  filterType: string;
  setFilterType: (val: string) => void;
  filterStartDate: string;
  setFilterStartDate: (val: string) => void;
  filterEndDate: string;
  setFilterEndDate: (val: string) => void;
  filterSearch: string;
  setFilterSearch: (val: string) => void;
  filterMinAmount: string;
  setFilterMinAmount: (val: string) => void;
  filterMaxAmount: string;
  setFilterMaxAmount: (val: string) => void;
  filterSortOrder: string;
  setFilterSortOrder: (val: string) => void;
  onCategoryChange: (transactionId: string, categoryId: string) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  categories,
  txLoading,
  filterCategory,
  setFilterCategory,
  filterType,
  setFilterType,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  filterSearch,
  setFilterSearch,
  filterMinAmount,
  setFilterMinAmount,
  filterMaxAmount,
  setFilterMaxAmount,
  filterSortOrder,
  setFilterSortOrder,
  onCategoryChange,
}) => {
  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Transactions Directory</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Comprehensive log of all cash flows</p>
        </div>
        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
          {transactions.length} items logged
        </span>
      </div>

      {/* Filters Panel */}
      <div className="filter-bar">
        <div className="filter-group" style={{ flex: '1 1 200px' }}>
          <label htmlFor="filter-search">Search Description</label>
          <input 
            id="filter-search"
            type="text"
            className="category-select"
            placeholder="e.g. Netflix, Swiggy..."
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-cat">Category</label>
          <select 
            id="filter-cat"
            className="category-select" 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-type">Type</label>
          <select 
            id="filter-type"
            className="category-select" 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-min">Min Amount (₹)</label>
          <input 
            id="filter-min"
            type="number"
            className="category-select"
            placeholder="Min"
            value={filterMinAmount}
            onChange={e => setFilterMinAmount(e.target.value)}
            style={{ width: '100px' }}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-max">Max Amount (₹)</label>
          <input 
            id="filter-max"
            type="number"
            className="category-select"
            placeholder="Max"
            value={filterMaxAmount}
            onChange={e => setFilterMaxAmount(e.target.value)}
            style={{ width: '100px' }}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-sort">Sort By</label>
          <select 
            id="filter-sort"
            className="category-select" 
            value={filterSortOrder} 
            onChange={e => setFilterSortOrder(e.target.value)}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-start">Start Date</label>
          <input 
            id="filter-start"
            type="date" 
            className="category-select" 
            value={filterStartDate} 
            onChange={e => setFilterStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-end">End Date</label>
          <input 
            id="filter-end"
            type="date" 
            className="category-select" 
            value={filterEndDate} 
            onChange={e => setFilterEndDate(e.target.value)}
          />
        </div>

        <button 
          className="btn-secondary" 
          style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
          onClick={() => {
            setFilterCategory('ALL');
            setFilterType('ALL');
            setFilterStartDate('');
            setFilterEndDate('');
            setFilterSearch('');
            setFilterMinAmount('');
            setFilterMaxAmount('');
            setFilterSortOrder('date-desc');
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Data Directory Table */}
      {txLoading ? (
        <div className="skeleton-loader" style={{ padding: '2rem 0' }}>
          <div className="skeleton-line" style={{ height: '2.5rem' }}></div>
          <div className="skeleton-line" style={{ height: '2.5rem' }}></div>
          <div className="skeleton-line" style={{ height: '2.5rem' }}></div>
        </div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No transactions match the selected filters.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.description}</div>
                      {t.merchantName && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Merchant: {t.merchantName}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <select 
                      value={t.categoryId || ''} 
                      onChange={e => onCategoryChange(t.id, e.target.value)}
                      className="category-select"
                      style={{ width: '160px', padding: '0.25rem 0.5rem' }}
                    >
                      <option value="null">Uncategorized</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {t.isSubscription ? (
                      <span className="badge" style={{ background: 'rgba(236,72,153,0.1)', color: 'var(--accent-pink)' }}>
                        Subscription
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                        Single
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: t.type === 'EXPENSE' ? 'var(--danger)' : 'var(--success)' }}>
                    {t.type === 'EXPENSE' ? '-' : '+'}₹{(Number(t.amount) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
