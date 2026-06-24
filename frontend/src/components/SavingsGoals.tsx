import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import { SavingsGoal } from '../types';

export const SavingsGoals = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  // Update progress state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [currentAmountInput, setCurrentAmountInput] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.goals.list();
      setGoals(res.data);
    } catch (err) {
      console.error('Failed to fetch goals', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.goals.create({
        name,
        targetAmount: parseFloat(targetAmount),
        deadline: deadline || undefined,
      });
      setGoals([res.data, ...goals]);
      setShowAddForm(false);
      setName('');
      setTargetAmount('');
      setDeadline('');
    } catch (err) {
      console.error('Failed to create goal', err);
    }
  };

  const handleUpdateProgress = async (id: string) => {
    try {
      const res = await api.goals.updateProgress(id, parseFloat(currentAmountInput));
      setGoals(goals.map(g => g.id === id ? res.data : g));
      setEditingGoalId(null);
    } catch (err) {
      console.error('Failed to update progress', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.goals.delete(id);
      setGoals(goals.filter(g => g.id !== id));
    } catch (err) {
      console.error('Failed to delete goal', err);
    }
  };

  if (loading) {
    return (
      <div className="skeleton-loader" style={{ padding: '2rem' }}>
        <div className="skeleton-line" style={{ height: '3rem', width: '40%' }}></div>
        <div className="skeleton-line" style={{ height: '8rem' }}></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Savings Goals</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Track progress towards your big purchases.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} /> New Goal
        </button>
      </div>

      {showAddForm && (
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', fontWeight: 700 }}>Create New Goal</h4>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="form-group">
              <label>Goal Name</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emergency Fund" required />
            </div>
            <div className="form-group">
              <label>Target Amount (₹)</label>
              <input type="number" className="form-input" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Deadline (Optional)</label>
              <input type="date" className="form-input" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn-primary" style={{ height: '42px', width: '100%', justifyContent: 'center' }}>Save Goal</button>
            </div>
          </form>
        </div>
      )}

      {goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed var(--glass-border)' }}>
          <Target size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>You haven't set any savings goals yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {goals.map(goal => {
            const percent = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            return (
              <div key={goal.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{goal.name}</h4>
                    {goal.deadline && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Target: {new Date(goal.deadline).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                  <button className="btn-icon" onClick={() => handleDelete(goal.id)}>
                    <Trash2 size={16} color="var(--text-muted)" />
                  </button>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      ₹{(goal.currentAmount / 100).toLocaleString('en-IN')} / ₹{(goal.targetAmount / 100).toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>{percent.toFixed(1)}%</span>
                  </div>
                  <div className="budget-progress-container" style={{ height: '10px' }}>
                    <div className="budget-progress-bar" style={{ width: `${percent}%`, backgroundColor: 'var(--success)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }} />
                  </div>
                </div>

                {editingGoalId === goal.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ padding: '0.4rem' }} 
                      value={currentAmountInput} 
                      onChange={e => setCurrentAmountInput(e.target.value)} 
                      placeholder="New current amount"
                    />
                    <button className="btn-primary" style={{ padding: '0.4rem 1rem' }} onClick={() => handleUpdateProgress(goal.id)}>Save</button>
                    <button className="btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={() => setEditingGoalId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn-secondary" style={{ padding: '0.4rem 1rem', width: 'fit-content', marginTop: '0.5rem' }} onClick={() => { setEditingGoalId(goal.id); setCurrentAmountInput((goal.currentAmount / 100).toString()); }}>
                    <Edit2 size={14} /> Update Progress
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
