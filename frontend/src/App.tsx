import React, { useState, useEffect } from 'react';
import { SpendingTrend, CategoryBreakdown } from './components/DashboardCharts';
import { Auth } from './components/Auth';
import { UploadModal } from './components/UploadModal';
import { TransactionTable } from './components/TransactionTable';
import { AIInsights } from './components/AIInsights';
import { api } from './services/api';
import { Transaction, Category, Statement } from './types';
import './index.css';

const App = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'statements' | 'ai'>('dashboard');

  // Core Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // For the full transactions tab
  const [categories, setCategories] = useState<Category[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [summary, setSummary] = useState({ totalSpend: 0, totalIncome: 0, savings: 0, budgetStatus: 'Healthy', categories: [] as any[] });
  
  // States & Filters
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  
  // Transaction Tab Filters
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchInitialData();
    }
  }, [token]);

  useEffect(() => {
    if (token && activeTab === 'transactions') {
      fetchFilteredTransactions();
    } else if (token && activeTab === 'statements') {
      fetchStatements();
    }
  }, [activeTab, filterCategory, filterType, filterStartDate, filterEndDate, token]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchCategoriesList()
      ]);
    } catch (err) {
      console.error('Failed to fetch initial data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [txRes, summaryRes] = await Promise.all([
        api.transactions.list({ limit: 10 }),
        api.transactions.summary()
      ]);
      setTransactions(txRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  const fetchCategoriesList = async () => {
    try {
      const res = await api.categories.list();
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchStatements = async () => {
    try {
      const res = await api.statements.list();
      setStatements(res.data);
    } catch (err) {
      console.error('Failed to fetch statements', err);
    }
  };

  const fetchFilteredTransactions = async () => {
    setTxLoading(true);
    try {
      const params: any = { limit: 100 };
      if (filterCategory !== 'ALL') params.categoryId = filterCategory;
      if (filterType !== 'ALL') params.type = filterType;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      
      const res = await api.transactions.list(params);
      setAllTransactions(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    try {
      // Optimistic update
      const val = categoryId === 'null' || !categoryId ? null : categoryId;
      
      const updateLocally = (txList: Transaction[]) => 
        txList.map(t => {
          if (t.id === transactionId) {
            const matchedCat = categories.find(c => c.id === val);
            return {
              ...t,
              categoryId: val,
              category: matchedCat ? { id: matchedCat.id, name: matchedCat.name, color: matchedCat.color } : null
            };
          }
          return t;
        });

      setTransactions(prev => updateLocally(prev));
      setAllTransactions(prev => updateLocally(prev));

      await api.transactions.update(transactionId, { categoryId: val });
      
      // Refresh dashboard summary to recalculate category breakdown
      const summaryRes = await api.transactions.summary();
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to update transaction category', err);
      // Revert if error
      fetchDashboardData();
      if (activeTab === 'transactions') fetchFilteredTransactions();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    setToken(null);
  };

  if (!token) {
    return <Auth onLogin={(t) => setToken(t)} />;
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Fin<span style={{ color: 'var(--accent-primary)' }}>Flow</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <div 
            style={{ 
              color: activeTab === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', 
              cursor: 'pointer',
              padding: '0.25rem 0'
            }}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </div>
          <div 
            style={{ 
              color: activeTab === 'transactions' ? 'var(--accent-primary)' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'transactions' ? 'bold' : 'normal', 
              cursor: 'pointer',
              padding: '0.25rem 0'
            }}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </div>
          <div 
            style={{ 
              color: activeTab === 'statements' ? 'var(--accent-primary)' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'statements' ? 'bold' : 'normal', 
              cursor: 'pointer',
              padding: '0.25rem 0'
            }}
            onClick={() => setActiveTab('statements')}
          >
            Statements
          </div>
          <div 
            style={{ 
              color: activeTab === 'ai' ? 'var(--accent-primary)' : 'var(--text-secondary)', 
              fontWeight: activeTab === 'ai' ? 'bold' : 'normal', 
              cursor: 'pointer',
              padding: '0.25rem 0'
            }}
            onClick={() => setActiveTab('ai')}
          >
            AI Advisory
          </div>
        </nav>
        <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem' }}>Logout</button>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        <header className="hero-text" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>GM, {localStorage.getItem('userFirstName') || localStorage.getItem('userEmail')?.split('@')[0] || 'User'}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Observe your financial flow today.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowUpload(true)}>+ Upload Statement</button>
        </header>

        {loading ? (
          <div className="skeleton-loader" style={{ padding: '2rem' }}>
            <div className="skeleton-line" style={{ height: '3rem' }}></div>
            <div className="skeleton-line" style={{ height: '10rem' }}></div>
            <div className="skeleton-line" style={{ height: '10rem' }}></div>
          </div>
        ) : (
          <>
            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
              <>
                {/* Stats Grid */}
                <section className="stat-grid">
                  <div className="glass-card">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Spend</p>
                    <h2 style={{ fontSize: '1.875rem', margin: '0.5rem 0' }}>₹{(summary.totalSpend / 100).toLocaleString('en-IN')}</h2>
                    <p style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>Calculated from statements</p>
                  </div>
                  <div className="glass-card">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Income</p>
                    <h2 style={{ fontSize: '1.875rem', margin: '0.5rem 0' }}>₹{(summary.totalIncome / 100).toLocaleString('en-IN')}</h2>
                    <p style={{ color: 'var(--success)', fontSize: '0.75rem' }}>Calculated from statements</p>
                  </div>
                  <div className="glass-card">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Net Savings</p>
                    <h2 style={{ fontSize: '1.875rem', margin: '0.5rem 0', color: summary.savings >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      ₹{(summary.savings / 100).toLocaleString('en-IN')}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Budget status: {summary.budgetStatus}</p>
                  </div>
                </section>

                {/* Main Content */}
                <section>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <SpendingTrend data={transactions.slice(0, 10).reverse().map(t => ({ date: new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), amount: t.amount }))} />
                    <CategoryBreakdown data={summary.categories || []} />
                  </div>
                  <TransactionTable transactions={transactions.slice(0, 5)} />
                </section>
              </>
            )}

            {/* Transactions View */}
            {activeTab === 'transactions' && (
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Transactions Directory</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{allTransactions.length} transaction(s) found</p>
                </div>

                {/* Filters */}
                <div className="filter-bar">
                  <div className="filter-group">
                    <label>Category</label>
                    <select 
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
                    <label>Type</label>
                    <select 
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
                    <label>Start Date</label>
                    <input 
                      type="date" 
                      className="category-select" 
                      value={filterStartDate} 
                      onChange={e => setFilterStartDate(e.target.value)}
                    />
                  </div>

                  <div className="filter-group">
                    <label>End Date</label>
                    <input 
                      type="date" 
                      className="category-select" 
                      value={filterEndDate} 
                      onChange={e => setFilterEndDate(e.target.value)}
                    />
                  </div>

                  <button 
                    className="btn-secondary" 
                    style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}
                    onClick={() => {
                      setFilterCategory('ALL');
                      setFilterType('ALL');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                  >
                    Clear Filters
                  </button>
                </div>

                {/* Directory Table */}
                {txLoading ? (
                  <div className="skeleton-loader">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                  </div>
                ) : allTransactions.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>
                    No transactions match the selected filters.
                  </p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>AI Category Correction</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTransactions.map(t => (
                        <tr key={t.id}>
                          <td>{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td>
                            <div>
                              <div style={{ fontWeight: '500' }}>{t.description}</div>
                              {t.merchantName && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Merchant: {t.merchantName}</div>}
                            </div>
                          </td>
                          <td>
                            <select 
                              value={t.categoryId || ''} 
                              onChange={e => handleCategoryChange(t.id, e.target.value)}
                              className="category-select"
                              style={{ width: '160px' }}
                            >
                              <option value="null">Uncategorized</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: t.type === 'EXPENSE' ? 'var(--danger)' : 'var(--success)' }}>
                            {t.type === 'EXPENSE' ? '-' : '+'}₹{(Number(t.amount) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* AI Advisory View */}
            {activeTab === 'ai' && (
              <div className="glass-card">
                <h3 style={{ marginBottom: '1.5rem' }}>AI Financial Advisory</h3>
                <AIInsights />
              </div>
            )}

            {/* Statements View */}
            {activeTab === 'statements' && (
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3>Statements History</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage and track your uploaded files</p>
                  </div>
                  <button className="btn-secondary" onClick={fetchStatements} style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>↺ Refresh</button>
                </div>

                {statements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>No statements uploaded yet.</p>
                    <button className="btn-primary" onClick={() => setShowUpload(true)}>Upload Your First Statement</button>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date Uploaded</th>
                        <th>Filename</th>
                        <th>Bank</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statements.map(s => (
                        <tr key={s.id}>
                          <td>{new Date(s.createdAt).toLocaleString()}</td>
                          <td style={{ fontWeight: '500' }}>{s.fileName}</td>
                          <td>{s.bankName}</td>
                          <td>
                            <span 
                              className="badge" 
                              style={{ 
                                backgroundColor: 
                                  s.status === 'COMPLETED' ? 'var(--success)20' : 
                                  s.status === 'PROCESSING' ? 'var(--accent-secondary)20' : 
                                  s.status === 'FAILED' ? 'var(--danger)20' : 'rgba(255,255,255,0.05)',
                                color: 
                                  s.status === 'COMPLETED' ? 'var(--success)' : 
                                  s.status === 'PROCESSING' ? 'var(--accent-secondary)' : 
                                  s.status === 'FAILED' ? 'var(--danger)' : 'var(--text-secondary)',
                                display: 'inline-block'
                              }}
                            >
                              {s.status}
                            </span>
                            {s.errorMessage && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                                Error: {s.errorMessage}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {showUpload && (
        <UploadModal 
          onClose={() => setShowUpload(false)} 
          onSuccess={() => {
            fetchDashboardData();
            if (activeTab === 'statements') fetchStatements();
          }} 
        />
      )}
    </div>
  );
};

export default App;
