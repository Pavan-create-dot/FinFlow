import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, PieChart, Pie, Legend
} from 'recharts';
import { CategorySummary, MonthlyTrend } from '../types';

// Formatting helper for Paise to Currency
const formatCurrency = (paise: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
};

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  padding: '8px 12px',
};

interface SpendingTrendItem {
  date: string;
  amount: number;
}

export const SpendingTrend = ({ data }: { data: SpendingTrendItem[] }) => (
  <div className="glass-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>Spending Trend</h3>
    <div style={{ flex: 1, minHeight: '260px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 25, left: 15, bottom: 20 }}>
          <defs>
            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={75}
            tickFormatter={(value) => `₹${(value / 100).toLocaleString('en-IN')}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#64748B', fontWeight: 500, fontSize: '12px' }}
            itemStyle={{ color: '#0F172A', fontWeight: 600, fontSize: '13px' }}
            formatter={(value: any) => [formatCurrency(Number(value)), 'Spent']}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#2563EB"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorSpend)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const CategoryBreakdown = ({ data }: { data: CategorySummary[] }) => (
  <div className="glass-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>Category Breakdown</h3>
    <div style={{ flex: 1, minHeight: '260px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 25, left: 10, bottom: 10 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            stroke="#64748B"
            fontSize={12}
            width={110}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#64748B', fontWeight: 500, fontSize: '12px' }}
            itemStyle={{ color: '#0F172A', fontWeight: 600, fontSize: '13px' }}
            formatter={(value: any) => [formatCurrency(Number(value)), 'Spent']}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#2563EB'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const MonthlyTrendChart = ({ data }: { data: MonthlyTrend[] }) => (
  <div className="glass-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>Monthly Expense Trend</h3>
    <div style={{ flex: 1, minHeight: '260px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 25, left: 15, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={75}
            tickFormatter={(value) => `₹${(value / 100).toLocaleString('en-IN')}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#64748B', fontWeight: 500, fontSize: '12px' }}
            itemStyle={{ color: '#0F172A', fontWeight: 600, fontSize: '13px' }}
            formatter={(value: any) => [formatCurrency(Number(value)), 'Spent']}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#8B5CF6"
            strokeWidth={3}
            dot={{ fill: '#8B5CF6', r: 4 }}
            activeDot={{ r: 7, stroke: '#FFFFFF', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const CategoryPieChart = ({ data }: { data: CategorySummary[] }) => {
  const activeData = data.filter(d => d.value > 0);
  return (
    <div className="glass-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>Category Distribution</h3>
      <div style={{ flex: 1, minHeight: '260px', width: '100%' }}>
        {activeData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No spending data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie
                data={activeData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {activeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#2563EB'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#64748B', fontWeight: 500, fontSize: '12px' }}
                itemStyle={{ color: '#0F172A', fontWeight: 600, fontSize: '13px' }}
                formatter={(value: any) => [formatCurrency(Number(value)), 'Spent']}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
