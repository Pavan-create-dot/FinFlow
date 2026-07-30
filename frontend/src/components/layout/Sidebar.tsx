import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  Calendar, 
  Target, 
  Sparkles, 
  FolderUp, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type TabType = 'dashboard' | 'transactions' | 'budgets' | 'subscriptions' | 'goals' | 'ai' | 'statements';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { userEmail, logout } = useAuth();

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.5px' }}>FinFlow</span>
        </div>

        <nav className="nav-menu">
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabClick('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </div>
          <div
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => handleTabClick('transactions')}
          >
            <Receipt size={18} />
            Transactions
          </div>
          <div
            className={`nav-item ${activeTab === 'budgets' ? 'active' : ''}`}
            onClick={() => handleTabClick('budgets')}
          >
            <PiggyBank size={18} />
            Budgets
          </div>
          <div
            className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => handleTabClick('subscriptions')}
          >
            <Calendar size={18} />
            Subscriptions
          </div>
          <div
            className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => handleTabClick('goals')}
          >
            <Target size={18} />
            Savings Goals
          </div>
          <div
            className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => handleTabClick('ai')}
          >
            <Sparkles size={18} />
            AI Advisory
          </div>
          <div
            className={`nav-item ${activeTab === 'statements' ? 'active' : ''}`}
            onClick={() => handleTabClick('statements')}
          >
            <FolderUp size={18} />
            Statements
          </div>
        </nav>

        <div className="sidebar-footer">
          <div style={{ padding: '0 0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Logged in as:<br />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, wordBreak: 'break-all' }}>
              {userEmail || 'User'}
            </span>
          </div>
          <button onClick={logout} className="btn-secondary" style={{ width: '100%', padding: '0.575rem' }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};
