import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';

export const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  const fetchInsights = async (force = false) => {
    // Skip if we already have cached data and this isn't a manual refresh
    if (!force && hasFetched.current && insights) return;
    
    setLoading(true);
    try {
      const { data } = await api.ai.insights();
      setInsights(data);
      hasFetched.current = true;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="glass-card ai-insights-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>AI Financial Advisor</h3>
        <button className="btn-icon" onClick={() => fetchInsights(true)} disabled={loading}>
          {loading ? '...' : '↺'}
        </button>
      </div>

      {loading ? (
        <div className="skeleton-loader">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
      ) : insights?.message ? (
        <p style={{ color: 'var(--text-secondary)' }}>{insights.message}</p>
      ) : insights ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="insight-item">
            <p className="insight-tag">SUMMARY</p>
            <p>{insights.summary}</p>
          </div>
          <div className="insight-item highlight">
            <p className="insight-tag">SAVING TIP</p>
            <p>{insights.savingTip}</p>
          </div>
          <div className="insight-item">
            <p className="insight-tag">ANOMALY</p>
            <p>{insights.anomalies || "No unusual activity detected."}</p>
          </div>
          <div className="insight-item">
            <p className="insight-tag">TOP CATEGORY</p>
            <p>{insights.topCategory || "Analyzing..."}</p>
          </div>
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>Upload your statements to see personalized AI insights.</p>
      )}
    </div>
  );
};
