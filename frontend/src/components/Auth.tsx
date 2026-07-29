import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Auth: React.FC = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      let data;
      if (isLogin) {
        const res = await api.auth.login({ email, password });
        data = res.data;
      } else {
        const res = await api.auth.register({ email, password, firstName, lastName });
        data = res.data;
      }
      login(
        data.accessToken,
        data.user?.email,
        data.user?.firstName
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
          <img
            src="/assets/logo/finflow-icon.svg"
            alt="FinFlow Logo"
            style={{ width: '56px', height: '56px' }}
          />
          <div style={{ fontSize: '1.625rem', fontWeight: 700, fontFamily: "'Inter', sans-serif", letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
            Fin<span style={{ color: 'var(--accent-primary)' }}>Flow</span>
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            PLAN. TRACK. GROW.
          </div>
        </div>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.25rem', opacity: 0.9 }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Show name fields only on registration */}
          {!isLogin && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>First Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label>Last Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
          )}
          <div>
            <label>Email</label>
            <input 
              type="email" 
              className="form-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
          
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
            {isLogin ? 'Sign In' : 'Join FinFlow'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span 
            style={{ color: 'var(--accent-primary)', cursor: 'pointer', marginLeft: '0.5rem', fontWeight: 600 }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </span>
        </p>
      </div>
    </div>
  );
};
