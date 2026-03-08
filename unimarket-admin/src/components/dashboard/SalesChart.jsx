// admin/src/components/dashboard/SalesChart.jsx
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';

const SalesChart = ({ data, period, height = 350, color = '#3B82F6', loading }) => {
  if (loading) {
    return <div className="h-[350px] bg-gray-100 rounded-xl animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center bg-gray-50 rounded-xl">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const formatXAxis = (value) => {
    if (period === 'hourly') return format(new Date(value), 'HH:00');
    if (period === 'daily') return format(new Date(value), 'MMM d');
    if (period === 'weekly') return format(new Date(value), "'W'w");
    if (period === 'monthly') return format(new Date(value), 'MMM yyyy');
    return value;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {format(new Date(label), 'PPP')}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium text-gray-900">
                {entry.name === 'revenue' 
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.value)
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey="_id" 
          tickFormatter={formatXAxis}
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickFormatter={(value) => 
            value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
          }
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={color}
          fill="url(#colorValue)"
          name="Revenue"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="orders"
          stroke="#10B981"
          fill="#10B981"
          fillOpacity={0.1}
          name="Orders"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SalesChart;