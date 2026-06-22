import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const hasFetched = useRef(false);

  // Chatbot State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm FinAI, your personalized financial advisor. I have analyzed your transactions and budgets. How can I help you optimize your cash flows today?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchInsights = async (force = false) => {
    if (!force && hasFetched.current && insights) return;
    
    setInsightsLoading(true);
    try {
      const { data } = await api.ai.insights();
      setInsights(data);
      hasFetched.current = true;
    } catch (err) {
      console.error(err);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || chatLoading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setChatLoading(true);

    try {
      // Build history context (omit first bot greeting message)
      const chatHistory = messages.slice(1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.ai.chat(textToSend, chatHistory);
      const botMsg: Message = { role: 'assistant', content: res.data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error communicating with my advisor engine. Please verify your connection and try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const suggestionPills = [
    "Review my budget status",
    "Give me three savings tips",
    "What is my biggest expense?",
    "How can I build an emergency fund?"
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '2rem', flexWrap: 'wrap' }}>
      
      {/* Left Panel: Static Insights */}
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Highlights & Recommendations</h4>
          <button 
            className="btn-icon" 
            onClick={() => fetchInsights(true)} 
            disabled={insightsLoading}
            style={{ width: '32px', height: '32px' }}
            title="Refresh static insights"
          >
            {insightsLoading ? '...' : '↺'}
          </button>
        </div>

        {insightsLoading ? (
          <div className="skeleton-loader">
            <div className="skeleton-line" style={{ height: '4rem' }}></div>
            <div className="skeleton-line" style={{ height: '4rem' }}></div>
            <div className="skeleton-line" style={{ height: '4rem' }}></div>
          </div>
        ) : insights?.message ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{insights.message}</p>
        ) : insights ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="insight-item">
              <p className="insight-tag">SUMMARY</p>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{insights.summary}</p>
            </div>
            <div className="insight-item highlight">
              <p className="insight-tag">SAVING OPPORTUNITY</p>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{insights.savingTip}</p>
            </div>
            <div className="insight-item">
              <p className="insight-tag">SPENDING ANOMALIES</p>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{insights.anomalies || "No unusual activities detected this period."}</p>
            </div>
            <div className="insight-item">
              <p className="insight-tag">TOP CATEGORY</p>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.4', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                {insights.topCategory || "Analyzing..."}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
            Upload statements to see personalized advisor summaries.
          </p>
        )}
      </div>

      {/* Right Panel: Chat Assistant */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '560px' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Chat with FinAI</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          Personalized advisor trained on your custom transactional files.
        </p>

        {/* Messages Feed */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem', 
          padding: '0.75rem', 
          background: 'rgba(0,0,0,0.15)',
          borderRadius: '0.75rem',
          border: '1px solid var(--glass-border)',
          marginBottom: '1rem'
        }}>
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              <div 
                style={{ 
                  fontSize: '0.65rem', 
                  color: 'var(--text-muted)', 
                  marginBottom: '0.2rem',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  fontWeight: 700
                }}
              >
                {m.role === 'user' ? 'YOU' : 'FinAI'}
              </div>
              <div 
                style={{ 
                  background: m.role === 'user' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  border: m.role === 'user' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  padding: '0.75rem 1rem',
                  borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  fontSize: '0.9rem',
                  lineHeight: '1.55',
                  whiteSpace: 'pre-wrap',
                  boxShadow: m.role === 'user' ? '0 4px 12px rgba(99, 102, 241, 0.1)' : 'none'
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 700 }}>FinAI</div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: '14px 14px 14px 2px', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <span className="skeleton-line" style={{ width: '8px', height: '8px', borderRadius: '50%', margin: 0, animationDelay: '0s' }}></span>
                <span className="skeleton-line" style={{ width: '8px', height: '8px', borderRadius: '50%', margin: 0, animationDelay: '0.2s' }}></span>
                <span className="skeleton-line" style={{ width: '8px', height: '8px', borderRadius: '50%', margin: 0, animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {suggestionPills.map((pill, idx) => (
            <button 
              key={idx}
              type="button"
              className="btn-secondary"
              onClick={() => handleSendMessage(pill)}
              disabled={chatLoading}
              style={{ 
                padding: '0.4rem 0.8rem', 
                fontSize: '0.75rem', 
                borderRadius: '2rem',
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)'
              }}
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder={chatLoading ? "FinAI is thinking..." : "Ask FinAI about your budgets or spend patterns..."}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            disabled={chatLoading}
            style={{ flex: 1 }}
          />
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={!inputMessage.trim() || chatLoading}
            style={{ padding: '0 1.5rem', height: '44px' }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
export default AIInsights;
