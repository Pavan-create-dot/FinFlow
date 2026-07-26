import React from 'react';
import { PiggyBank, AlertCircle, Trash2 } from 'lucide-react';
import { CategoryPieChart, MonthlyTrendChart } from '../components/DashboardCharts';
import { Budget, Category, FinanceSummary } from '../types';

interface BudgetsPageProps {
  budgets: Budget[];
  categories: Category[];
  summary: FinanceSummary;
  budgetLoading: boolean;
  budgetCategory: string;
  setBudgetCategory: (val: string) => void;
  budgetAmount: string;
  setBudgetAmount: (val: string) => void;
  budgetError: string;
  onSaveBudget: (e: React.FormEvent) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({
  budgets,
  categories,
  summary,
  budgetLoading,
  budgetCategory,
  setBudgetCategory,
  budgetAmount,
  setBudgetAmount,
  budgetError,
  onSaveBudget,
  onDeleteBudget,
}) => {
  return (
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
                        onClick={() => onDeleteBudget(b.id)}
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
          <form onSubmit={onSaveBudget}>
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
  );
};
