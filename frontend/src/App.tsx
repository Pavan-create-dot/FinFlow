import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  Sparkles, 
  FolderUp, 
  LogOut, 
  Plus, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  DollarSign, 
  Info,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Trash2,
  Target,
  Menu,
  X
} from 'lucide-react';
import { SpendingTrend, CategoryBreakdown, MonthlyTrendChart, CategoryPieChart } from './components/DashboardCharts';
import { Auth } from './components/Auth';
import { UploadModal } from './components/UploadModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { TransactionTable } from './components/TransactionTable';
import { AIInsights } from './components/AIInsights';
import { SavingsGoals } from './components/SavingsGoals';
import { api } from './services/api';
import { Transaction, Category, Statement, Budget } from './types';
import './index.css';

const App = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [showUpload, setShowUpload] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budgets' | 'subscriptions' | 'ai' | 'statements' | 'goals'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile sidebar drawer when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Core Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // For transactions search
  const [categories, setCategories] = useState<Category[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [summary, setSummary] = useState({ 
    totalSpend: 0, 
    totalIncome: 0, 
    savings: 0, 
    budgetStatus: 'Healthy', 
    categories: [] as any[],
    finScore: 75,
    anomalies: [] as string[],
    monthlyTrend: [] as any[]
  });
  
  // States & Filters
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  
  // Transaction Tab Filters
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterSortOrder, setFilterSortOrder] = useState('date-desc');

  // Budget Setup State
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetError, setBudgetError] = useState('');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchInitialData();
    }
  }, [token]);

  useEffect(() => {
    const handleAuthLogout = () => {
      setToken(null);
    };
    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, []);


  useEffect(() => {
    if (token) {
      if (activeTab === 'transactions') {
        fetchFilteredTransactions();
      } else if (activeTab === 'statements') {
        fetchStatements();
      } else if (activeTab === 'budgets') {
        fetchBudgets();
      } else if (activeTab === 'subscriptions') {
        fetchSubscriptions();
      } else if (activeTab === 'goals') {
        fetchGoals();
      }
    }
  }, [
    activeTab, 
    filterCategory, 
    filterType, 
    filterStartDate, 
    filterEndDate, 
    filterSearch, 
    filterMinAmount, 
    filterMaxAmount, 
    filterSortOrder, 
    token
  ]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchCategoriesList(),
        fetchGoals()
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

  const fetchBudgets = async () => {
    setBudgetLoading(true);
    try {
      const res = await api.budgets.list();
      setBudgets(res.data);
    } catch (err) {
      console.error('Failed to fetch budgets', err);
    } finally {
      setBudgetLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    setSubLoading(true);
    try {
      const res = await api.transactions.list({ isSubscription: true, limit: 100 });
      setSubscriptions(res.data);
    } catch (err) {
      console.error('Failed to fetch subscriptions', err);
    } finally {
      setSubLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await api.goals.list();
      setGoals(res.data);
    } catch (err) {
      console.error('Failed to fetch goals', err);
    }
  };

  const fetchFilteredTransactions = async () => {
    setTxLoading(true);
    try {
      const params: any = { limit: 150 };
      if (filterCategory !== 'ALL') params.categoryId = filterCategory;
      if (filterType !== 'ALL') params.type = filterType;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterSearch) params.search = filterSearch;
      if (filterMinAmount) params.minAmount = filterMinAmount;
      if (filterMaxAmount) params.maxAmount = filterMaxAmount;
      if (filterSortOrder) params.sortOrder = filterSortOrder;
      
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
      
      // Refresh analytics summary
      const summaryRes = await api.transactions.summary();
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to update transaction category', err);
      fetchDashboardData();
      if (activeTab === 'transactions') fetchFilteredTransactions();
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCategory || !budgetAmount) {
      setBudgetError('Please select a category and enter an amount.');
      return;
    }

    const numericAmount = parseFloat(budgetAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setBudgetError('Please enter a valid amount.');
      return;
    }

    setBudgetError('');
    try {
      const amountInPaise = Math.round(numericAmount * 100);
      const res = await api.budgets.save({
        categoryId: budgetCategory,
        amount: amountInPaise
      });
      
      // Update budgets list
      setBudgets(prev => {
        const index = prev.findIndex(b => b.categoryId === budgetCategory);
        if (index > -1) {
          const next = [...prev];
          next[index] = res.data;
          return next;
        }
        return [...prev, res.data];
      });

      // Clear input fields
      setBudgetAmount('');
      setBudgetCategory('');

      // Refresh dashboard summary budget status
      const summaryRes = await api.transactions.summary();
      setSummary(summaryRes.data);
    } catch (err: any) {
      setBudgetError(err.response?.data?.error || 'Failed to save budget.');
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await api.budgets.delete(budgetId);
      setBudgets(prev => prev.filter(b => b.id !== budgetId));

      const summaryRes = await api.transactions.summary();
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to delete budget', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    setToken(null);
  };

  // Helper: calculate total monthly subscription cost
  const calculateSubscriptionMetrics = () => {
    // Unique recurring descriptions to avoid duplicates if statements cover multiple months
    const uniqueSubs = new Map<string, number>();
    subscriptions.forEach(s => {
      const key = s.description.toLowerCase();
      const currentVal = uniqueSubs.get(key) || 0;
      // We take the max or average of the subscription amount as estimated monthly rate
      if (s.amount > currentVal) {
        uniqueSubs.set(key, s.amount);
      }
    });

    const total = Array.from(uniqueSubs.values()).reduce((sum, amt) => sum + amt, 0);
    return {
      monthlyTotal: total,
      activeCount: uniqueSubs.size
    };
  };

  const subMetrics = calculateSubscriptionMetrics();

  // Helper: count budgets exceeded
  const exceededBudgetsCount = budgets.filter(b => b.spent > b.amount).length;

  if (!token) {
    return <Auth onLogin={(t) => setToken(t)} />;
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="logo">
          <div className="logo-icon">🗲</div>
          Fin<span>Flow</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="hamburger-btn" onClick={() => setShowUpload(true)} title="Upload Statement">
            <FolderUp size={20} />
          </button>
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} title="Menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo">
          <div className="logo-icon">🗲</div>
          Fin<span>Flow</span>
        </div>
        <nav className="nav-menu">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </div>
          <div 
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <Receipt size={18} />
            Transactions
          </div>
          <div 
            className={`nav-item ${activeTab === 'budgets' ? 'active' : ''}`}
            onClick={() => setActiveTab('budgets')}
          >
            <PiggyBank size={18} />
            Budgets
          </div>
          <div 
            className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            <Calendar size={18} />
            Subscriptions
          </div>
          <div 
            className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            <Target size={18} />
            Savings Goals
          </div>
          <div 
            className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles size={18} />
            AI Advisory
          </div>
          <div 
            className={`nav-item ${activeTab === 'statements' ? 'active' : ''}`}
            onClick={() => setActiveTab('statements')}
          >
            <FolderUp size={18} />
            Statements
          </div>
        </nav>
        
        <div className="sidebar-footer">
          <div style={{ padding: '0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Logged in as:<br />
            <span style={{ color: 'white', fontWeight: 600, wordBreak: 'break-all' }}>
              {localStorage.getItem('userEmail')}
            </span>
          </div>
          <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', padding: '0.65rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="hero-text">
            <h1>GM, {localStorage.getItem('userFirstName') || localStorage.getItem('userEmail')?.split('@')[0] || 'User'}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Track, budget, and optimize your financial flows.</p>
          </div>
          <div className="quick-actions-bar">
            <button className="btn-secondary" onClick={() => setShowAddTx(true)}>
              <Plus size={16} /> Log Expense
            </button>
            <button className="btn-primary" onClick={() => setShowUpload(true)}>
              <FolderUp size={16} /> Upload Statement
            </button>
          </div>
        </header>

        {loading ? (
          <div className="skeleton-loader" style={{ padding: '2rem' }}>
            <div className="skeleton-line" style={{ height: '3rem', width: '40%' }}></div>
            <div className="skeleton-line" style={{ height: '8rem' }}></div>
            <div className="skeleton-line" style={{ height: '14rem' }}></div>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <>
                {/* Stats Grid */}
                <section className="stat-grid">
                  {/* Total Income */}
                  <div className="glass-card stat-card income">
                    <div>
                      <div className="stat-icon">
                        <TrendingUp size={20} />
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Total Income</p>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0', fontFamily: 'Outfit' }}>
                        ₹{(summary.totalIncome / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </h3>
                    </div>
                  </div>

                  {/* Total Expenses */}
                  <div className="glass-card stat-card spend">
                    <div>
                      <div className="stat-icon">
                        <TrendingDown size={20} />
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Total Expenses</p>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0', fontFamily: 'Outfit' }}>
                        ₹{(summary.totalSpend / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </h3>
                    </div>
                  </div>

                  {/* Savings Rate */}
                  <div className="glass-card stat-card savings">
                    <div>
                      <div className="stat-icon">
                        <DollarSign size={20} />
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Savings Rate</p>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0', fontFamily: 'Outfit', color: 'var(--success)' }}>
                        {(summary.totalIncome > 0 ? ((summary.totalIncome - summary.totalSpend) / summary.totalIncome * 100) : 0).toFixed(1)}%
                      </h3>
                    </div>
                  </div>

                  {/* Cash Flow */}
                  <div className="glass-card stat-card" style={{ borderLeft: '3px solid ' + (summary.savings >= 0 ? 'var(--success)' : 'var(--danger)') }}>
                    <div>
                      <div className="stat-icon" style={{ color: summary.savings >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        <RefreshCw size={20} />
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Cash Flow</p>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0', fontFamily: 'Outfit', color: summary.savings >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {summary.savings >= 0 ? '+' : ''}₹{(summary.savings / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </h3>
                    </div>
                  </div>

                  {/* Highest Spending Category */}
                  <div className="glass-card stat-card">
                    <div>
                      <div className="stat-icon" style={{ color: 'var(--accent-pink)' }}>
                        <CreditCard size={20} />
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Top Spend Category</p>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0.25rem 0', fontFamily: 'Outfit', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {summary.categories && summary.categories.length > 0 
                          ? summary.categories.reduce((max, cat) => cat.value > max.value ? cat : max, summary.categories[0]).name
                          : 'None'}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        ₹{(summary.categories && summary.categories.length > 0 
                          ? summary.categories.reduce((max, cat) => cat.value > max.value ? cat : max, summary.categories[0]).value / 100
                          : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} spent
                      </p>
                    </div>
                  </div>

                  {/* Monthly Goal Progress */}
                  <div className="glass-card stat-card">
                    <div>
                      <div className="stat-icon" style={{ color: 'var(--accent-cyan)' }}>
                        <Target size={20} />
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Goal Progress</p>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0', fontFamily: 'Outfit', color: 'var(--accent-cyan)' }}>
                        {goals.length > 0
                          ? (goals.reduce((sum, g) => sum + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) : 0), 0) / goals.length * 100).toFixed(0) + '%'
                          : '0%'}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{goals.length} active goals</p>
                    </div>
                  </div>
                </section>

                {/* Insights Row */}
                <div className="grid-insights">
                  {/* FinScore Widget */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Financial Health Score</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Dynamic metric calculating budgeting & saving health</p>
                      </div>
                      <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        border: '5px solid var(--glass-border)',
                        borderTopColor: summary.finScore >= 70 ? 'var(--success)' : summary.finScore >= 50 ? 'var(--warning)' : 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.3rem',
                        fontFamily: 'Outfit',
                        boxShadow: '0 0 15px ' + (summary.finScore >= 70 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)')
                      }}>
                        {summary.finScore}
                      </div>
                    </div>
                    <div className="budget-progress-container" style={{ height: '6px' }}>
                      <div className="budget-progress-bar" style={{
                        width: `${summary.finScore}%`,
                        backgroundColor: summary.finScore >= 70 ? 'var(--success)' : summary.finScore >= 50 ? 'var(--warning)' : 'var(--danger)'
                      }} />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {summary.finScore >= 80 ? "🎉 Excellent! Your cash flows are extremely optimized with healthy savings." :
                       summary.finScore >= 60 ? "👍 Good job. Focus on keeping your subscriptions and category budgets under control." :
                       "⚠️ Action required: High burn rate or exceeded budgets are impacting your score."}
                    </p>
                  </div>

                  {/* Anomalies Widget */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertCircle size={18} /> Financial Alerts
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Unusual transactions or budget anomalies detected</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                      {summary.anomalies && summary.anomalies.length > 0 ? (
                        summary.anomalies.map((anomaly, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.8rem', background: 'rgba(244,63,94,0.05)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(244,63,94,0.1)' }}>
                            <AlertCircle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{anomaly}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', background: 'rgba(16,185,129,0.05)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(16,185,129,0.1)', color: 'var(--success)' }}>
                          <AlertCircle size={14} color="var(--success)" />
                          <span>No anomalies detected. Your spending is normal.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dashboard Charts */}
                <section>
                  <div className="grid-charts">
                    <SpendingTrend data={transactions.slice(0, 15).reverse().map(t => ({ date: new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), amount: t.amount }))} />
                    <CategoryBreakdown data={summary.categories || []} />
                  </div>
                  
                  {/* Recent Table */}
                  <TransactionTable transactions={transactions.slice(0, 8)} />
                </section>
              </>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Transactions Directory</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Comprehensive log of all cash flows</p>
                  </div>
                  <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                    {allTransactions.length} items logged
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
                ) : allTransactions.length === 0 ? (
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
                        {allTransactions.map(t => (
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
                                onChange={e => handleCategoryChange(t.id, e.target.value)}
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
            )}

            {/* Budgets Tab */}
            {activeTab === 'budgets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Visual Analytics Row */}
                <div className="grid-budget-analytics">
                  <CategoryPieChart data={summary.categories || []} />
                  <MonthlyTrendChart data={summary.monthlyTrend || []} />
                </div>

                <div className="grid-budget-layout">
                  {/* Budget status list */}
                <div className="glass-card">
                  <h3 style={{ marginBottom: '0.25rem', fontSize: '1.25rem', fontWeight: 700 }}>Monthly Limits & Targets</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    Track your category-wise spending limits dynamically.
                  </p>

                  {budgetLoading ? (
                    <div className="skeleton-loader">
                      <div className="skeleton-line" style={{ height: '3rem' }}></div>
                      <div className="skeleton-line" style={{ height: '3rem' }}></div>
                    </div>
                  ) : budgets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', border: '1px dashed var(--glass-border)', borderRadius: '1rem' }}>
                      <PiggyBank size={36} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                      <p style={{ color: 'var(--text-secondary)' }}>No spending budgets configured yet.</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Use the budget creator on the right to set one.</p>
                    </div>
                  ) : (
                    <div className="budget-grid">
                      {budgets.map(b => {
                        const percent = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
                        let color = 'var(--success)';
                        if (percent > 100) color = 'var(--danger)';
                        else if (percent > 70) color = 'var(--warning)';

                        return (
                          <div className="glass-card budget-card" key={b.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="badge" style={{ backgroundColor: (b.category?.color || '#6366f1') + '15', color: b.category?.color }}>
                                  {b.category?.name}
                                </span>
                              </div>
                              <button 
                                className="btn-icon" 
                                style={{ width: '32px', height: '32px', border: 'none', background: 'transparent' }}
                                onClick={() => handleDeleteBudget(b.id)}
                                title="Delete budget"
                              >
                                <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                              </button>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Spend Progress</span>
                                <span style={{ fontWeight: 700, color }}>{Math.round(percent)}%</span>
                              </div>
                              <div className="budget-progress-container">
                                <div 
                                  className="budget-progress-bar" 
                                  style={{ 
                                    width: `${Math.min(percent, 100)}%`, 
                                    backgroundColor: color,
                                    boxShadow: `0 0 8px ${color}80`
                                  }}
                                />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  Spent: ₹{(b.spent / 100).toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                  Limit: ₹{(b.amount / 100).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                            
                            {percent > 100 && (
                              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                <AlertCircle size={12} />
                                <span>Exceeded by ₹{((b.spent - b.amount) / 100).toLocaleString('en-IN')}!</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Create Budget Card */}
                <div className="glass-card" style={{ height: 'fit-content' }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Set Category Limit</h4>
                  <form onSubmit={handleSaveBudget}>
                    <div className="form-group">
                      <label htmlFor="budget-cat">Category</label>
                      <select 
                        id="budget-cat"
                        className="form-input"
                        value={budgetCategory}
                        onChange={e => setBudgetCategory(e.target.value)}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => c.name !== 'Salary').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="budget-amt">Monthly Limit (₹)</label>
                      <input 
                        id="budget-amt"
                        type="number"
                        placeholder="e.g. 5000"
                        className="form-input"
                        value={budgetAmount}
                        onChange={e => setBudgetAmount(e.target.value)}
                        required
                      />
                    </div>

                    {budgetError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{budgetError}</p>}

                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Set Budget
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
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
                        {subMetrics.activeCount}
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Unique recurring services detected</p>
                    </div>
                  </div>

                  <div className="glass-card stat-card" style={{ minHeight: '140px' }}>
                    <div>
                      <div className="stat-icon" style={{ color: 'var(--accent-secondary)', background: 'rgba(168, 85, 247, 0.08)' }}>
                        <Calendar size={22} />
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Monthly Spend Est.</p>
                    </div>
                    <div>
                      <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0', fontFamily: 'Outfit', color: 'var(--accent-pink)' }}>
                        ₹{(subMetrics.monthlyTotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Annualized: ₹{((subMetrics.monthlyTotal * 12) / 100).toLocaleString('en-IN')}</p>
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
            )}

            {/* AI Advisory Tab */}
            {activeTab === 'ai' && (
              <div className="glass-card">
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI Financial Advisory</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Deep contextual analytics by Gemini 2.5 Flash</p>
                </div>
                <AIInsights />
              </div>
            )}

            {/* Statements Tab */}
            {activeTab === 'statements' && (
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Statements History</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Upload history and parser queue logs</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => setShowUpload(true)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      <FolderUp size={14} /> Upload
                    </button>
                    <button className="btn-secondary" onClick={fetchStatements} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                </div>

                {statements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>No statements uploaded yet.</p>
                    <button className="btn-primary" onClick={() => setShowUpload(true)} style={{ margin: '0 auto' }}>
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
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this statement and its transactions?')) {
                                    try {
                                      await api.statements.delete(s.id);
                                      fetchStatements();
                                      fetchDashboardData();
                                    } catch (err) {
                                      alert('Failed to delete statement');
                                    }
                                  }
                                }}
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
            )}

            {/* Savings Goals Tab */}
            {activeTab === 'goals' && (
              <div className="glass-card">
                <SavingsGoals />
              </div>
            )}
          </>
        )}
        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom-nav">
          <button className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} />
            <span>Home</span>
          </button>
          <button className={`bottom-nav-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            <Receipt size={20} />
            <span>Txns</span>
          </button>
          <button className={`bottom-nav-item ${activeTab === 'budgets' ? 'active' : ''}`} onClick={() => setActiveTab('budgets')}>
            <PiggyBank size={20} />
            <span>Budget</span>
          </button>
          <button className={`bottom-nav-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
            <Sparkles size={20} />
            <span>AI</span>
          </button>
          <button className="bottom-nav-item" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={20} />
            <span>More</span>
          </button>
        </nav>
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

      {showAddTx && (
        <AddTransactionModal
          categories={categories}
          onClose={() => setShowAddTx(false)}
          onSuccess={() => {
            fetchDashboardData();
            if (activeTab === 'transactions') fetchFilteredTransactions();
            if (activeTab === 'budgets') fetchBudgets();
            if (activeTab === 'subscriptions') fetchSubscriptions();
          }}
        />
      )}
    </div>
  );
};

export default App;
