import React from 'react';
import { FolderUp, Menu, X, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onOpenUpload: () => void;
  onOpenAddTx: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenUpload,
  onOpenAddTx,
}) => {
  const { userFirstName, userEmail } = useAuth();
  const displayName = userFirstName || (userEmail ? userEmail.split('@')[0] : 'User');

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img
            src="/logo.svg"
            alt="FinFlow Logo"
            style={{ width: '34px', height: '34px', filter: 'drop-shadow(0px 2px 6px rgba(0, 245, 212, 0.35))' }}
          />
          <span style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            Fin<span style={{ color: '#00F5D4' }}>Flow</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="hamburger-btn" onClick={onOpenUpload} title="Upload Statement">
            <FolderUp size={20} />
          </button>
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} title="Menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Main Content Hero Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="hero-text">
          <h1>GM, {displayName}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track, budget, and optimize your financial flows.</p>
        </div>
        <div className="quick-actions-bar">
          <button className="btn-secondary" onClick={onOpenAddTx}>
            <Plus size={16} /> Log Expense
          </button>
          <button className="btn-primary" onClick={onOpenUpload}>
            <FolderUp size={16} /> Upload Statement
          </button>
        </div>
      </header>
    </>
  );
};
