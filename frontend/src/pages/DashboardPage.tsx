import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw, 
  CreditCard, 
  Target,
  AlertCircle 
} from 'lucide-react';
import { SpendingTrend, CategoryBreakdown } from '../components/DashboardCharts';
import { TransactionTable } from '../components/TransactionTable';
import { Transaction, FinanceSummary, SavingsGoal } from '../types';

interface DashboardPageProps {
  summary: FinanceSummary;
  transactions: Transaction[];
  goals: SavingsGoal[];
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  transactions,
  goals,
}) => {
  return (
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
  );
};
