import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  Sparkles, 
  FolderUp, 
  Plus, 
  Menu 
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Auth } from './components/Auth';
import { UploadModal } from './components/UploadModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AIInsights } from './components/AIInsights';
import { SavingsGoals } from './components/SavingsGoals';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { StatementsPage } from './pages/StatementsPage';
import { api } from './services/api';
import { Transaction, Category, Statement, Budget } from './types';
import './index.css';

const App = () => {
  const { token, isAuthenticated } = useAuth();

  const [showUpload, setShowUpload] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile sidebar drawer when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // --- Core Data ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
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
  
  // --- Loading States ---
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  
  // --- Transaction Tab Filters ---
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterSortOrder, setFilterSortOrder] = useState('date-desc');

  // --- Budget Setup State ---
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetError, setBudgetError] = useState('');

  // =============================================
  //  Data Fetching
  // =============================================

  useEffect(() => {
    if (token) {
      fetchInitialData();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      if (activeTab === 'transactions') fetchFilteredTransactions();
      else if (activeTab === 'statements') fetchStatements();
      else if (activeTab === 'budgets') fetchBudgets();
      else if (activeTab === 'subscriptions') fetchSubscriptions();
      else if (activeTab === 'goals') fetchGoals();
    }
  }, [
    activeTab, filterCategory, filterType, filterStartDate, filterEndDate,
    filterSearch, filterMinAmount, filterMaxAmount, filterSortOrder, token
  ]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDashboardData(), fetchCategoriesList(), fetchGoals()]);
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

  // =============================================
  //  Event Handlers
  // =============================================

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
      
      setBudgets(prev => {
        const index = prev.findIndex(b => b.categoryId === budgetCategory);
        if (index > -1) {
          const next = [...prev];
          next[index] = res.data;
          return next;
        }
        return [...prev, res.data];
      });

      setBudgetAmount('');
      setBudgetCategory('');

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

  // =============================================
  //  Render
  // =============================================

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Container */}
      <main className="main-content">
        <Navbar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onOpenUpload={() => setShowUpload(true)}
          onOpenAddTx={() => setShowAddTx(true)}
        />

        {loading ? (
          <div className="skeleton-loader" style={{ padding: '2rem' }}>
            <div className="skeleton-line" style={{ height: '3rem', width: '40%' }}></div>
            <div className="skeleton-line" style={{ height: '8rem' }}></div>
            <div className="skeleton-line" style={{ height: '14rem' }}></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardPage
                summary={summary}
                transactions={transactions}
                goals={goals}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsPage
                transactions={allTransactions}
                categories={categories}
                txLoading={txLoading}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                filterType={filterType}
                setFilterType={setFilterType}
                filterStartDate={filterStartDate}
                setFilterStartDate={setFilterStartDate}
                filterEndDate={filterEndDate}
                setFilterEndDate={setFilterEndDate}
                filterSearch={filterSearch}
                setFilterSearch={setFilterSearch}
                filterMinAmount={filterMinAmount}
                setFilterMinAmount={setFilterMinAmount}
                filterMaxAmount={filterMaxAmount}
                setFilterMaxAmount={setFilterMaxAmount}
                filterSortOrder={filterSortOrder}
                setFilterSortOrder={setFilterSortOrder}
                onCategoryChange={handleCategoryChange}
              />
            )}

            {activeTab === 'budgets' && (
              <BudgetsPage
                budgets={budgets}
                categories={categories}
                summary={summary}
                budgetLoading={budgetLoading}
                budgetCategory={budgetCategory}
                setBudgetCategory={setBudgetCategory}
                budgetAmount={budgetAmount}
                setBudgetAmount={setBudgetAmount}
                budgetError={budgetError}
                onSaveBudget={handleSaveBudget}
                onDeleteBudget={handleDeleteBudget}
              />
            )}

            {activeTab === 'subscriptions' && (
              <SubscriptionsPage
                subscriptions={subscriptions}
                subLoading={subLoading}
              />
            )}

            {activeTab === 'ai' && (
              <div className="glass-card">
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI Financial Advisory</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Deep contextual analytics by Gemini 2.5 Flash</p>
                </div>
                <AIInsights />
              </div>
            )}

            {activeTab === 'statements' && (
              <StatementsPage
                statements={statements}
                onOpenUpload={() => setShowUpload(true)}
                onRefresh={fetchStatements}
                onRefreshDashboard={fetchDashboardData}
              />
            )}

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
