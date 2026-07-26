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
        <div className="logo" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img
            src="/logo.svg"
            alt="FinFlow Logo"
            style={{ width: '44px', height: '44px', filter: 'drop-shadow(0px 2px 8px rgba(0, 245, 212, 0.35))' }}
          />
          <span style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif" }}>
            Fin<span style={{ color: '#00F5D4' }}>Flow</span>
          </span>
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
          <div style={{ padding: '0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Logged in as:<br />
            <span style={{ color: 'white', fontWeight: 600, wordBreak: 'break-all' }}>
              {userEmail || 'User'}
            </span>
          </div>
          <button onClick={logout} className="btn-secondary" style={{ width: '100%', padding: '0.65rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};
