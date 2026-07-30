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
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGradNav" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
            </defs>
            <rect width="30" height="30" rx="8" fill="url(#logoGradNav)" />
            <path d="M9 8h12v3H12v3h8v3h-8v6H9V8z" fill="white" />
          </svg>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.5px' }}>FinFlow</span>
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
