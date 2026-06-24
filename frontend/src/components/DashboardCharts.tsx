import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, PieChart, Pie, Legend } from 'recharts';

// Formatting helper for Paise to Currency
const formatCurrency = (paise: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
};

export const SpendingTrend = ({ data }: { data: any[] }) => (
  <div className="glass-card" style={{ height: '350px' }}>
    <h3 style={{ marginBottom: '1.5rem', color: '#fff' }}>Spending Trend</h3>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="#94a3b8" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
        />
        <YAxis 
          stroke="#94a3b8" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => `₹${value/100}`}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
          formatter={(value: any) => [formatCurrency(value), 'Spent']}
        />
        <Area 
          type="monotone" 
          dataKey="amount" 
          stroke="#6366f1" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorSpend)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const CategoryBreakdown = ({ data }: { data: any[] }) => (
  <div className="glass-card" style={{ height: '350px' }}>
    <h3 style={{ marginBottom: '1.5rem', color: '#fff' }}>Category Breakdown</h3>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical">
        <XAxis type="number" hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          stroke="#94a3b8" 
          fontSize={12} 
          width={100}
        />
        <Tooltip 
          cursor={{ fill: 'transparent' }}
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const MonthlyTrendChart = ({ data }: { data: any[] }) => (
  <div className="glass-card" style={{ height: '350px' }}>
    <h3 style={{ marginBottom: '1.5rem', color: '#fff' }}>Monthly Expense Trend</h3>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis 
          dataKey="month" 
          stroke="#94a3b8" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
        />
        <YAxis 
          stroke="#94a3b8" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => `₹${value/100}`}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
          formatter={(value: any) => [formatCurrency(value), 'Spent']}
        />
        <Line 
          type="monotone" 
          dataKey="amount" 
          stroke="#a855f7" 
          strokeWidth={3}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const CategoryPieChart = ({ data }: { data: any[] }) => {
  const activeData = data.filter(d => d.value > 0);
  return (
    <div className="glass-card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '1.5rem', color: '#fff' }}>Category Distribution</h3>
      <div style={{ flex: 1, minHeight: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activeData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {activeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              formatter={(value: any) => [formatCurrency(value), 'Spent']}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
