// admin/src/components/dashboard/TrafficSources.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Globe, Monitor, Smartphone, Tablet, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

const COLORS = {
  'direct': '#3B82F6',
  'organic': '#10B981',
  'social': '#F59E0B',
  'referral': '#8B5CF6',
  'email': '#EC4899',
  'paid': '#EF4444',
  'other': '#6B7280'
};

const TrafficSources = ({ data = null, loading = false }) => {
  const [selectedSource, setSelectedSource] = useState(null);
  const [timeframe, setTimeframe] = useState('week');

  // Default mock data if none provided
  const defaultData = [
    { name: 'Direct', value: 2450, change: 12.5, trend: 'up', color: COLORS.direct },
    { name: 'Organic Search', value: 1875, change: 8.3, trend: 'up', color: COLORS.organic },
    { name: 'Social Media', value: 1240, change: -2.1, trend: 'down', color: COLORS.social },
    { name: 'Referral', value: 890, change: 15.2, trend: 'up', color: COLORS.referral },
    { name: 'Email', value: 540, change: 5.7, trend: 'up', color: COLORS.email },
    { name: 'Paid Ads', value: 320, change: -5.3, trend: 'down', color: COLORS.paid },
    { name: 'Other', value: 180, change: 0, trend: 'flat', color: COLORS.other }
  ];

  const chartData = data || defaultData;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">Visitors:</span>
              <span className="font-medium text-gray-900">{formatNumber(data.value)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">Share:</span>
              <span className="font-medium text-gray-900">{percentage}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">Change:</span>
              <span className={`flex items-center gap-1 font-medium ${
                data.trend === 'up' ? 'text-green-600' : 
                data.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {data.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {data.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                {data.change > 0 ? '+' : ''}{data.change}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    if (!payload) return null;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {payload.map((entry, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => setSelectedSource(entry.payload)}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">
                {entry.payload.name}
              </div>
              <div className="text-xs text-gray-500">
                {((entry.payload.value / total) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary-600" />
            Traffic Sources
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            {formatNumber(total)} total visitors
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {['day', 'week', 'month'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeframe === period
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => 
                percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
              }
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="#fff"
                  strokeWidth={2}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={() => setSelectedSource(entry)}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Source Details */}
      {selectedSource && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 pt-6 border-t border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">{selectedSource.name} Details</h4>
            <button
              onClick={() => setSelectedSource(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Visitors</div>
              <div className="text-xl font-bold text-gray-900">
                {formatNumber(selectedSource.value)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Share</div>
              <div className="text-xl font-bold text-gray-900">
                {((selectedSource.value / total) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Change</div>
              <div className={`text-xl font-bold flex items-center gap-1 ${
                selectedSource.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedSource.trend === 'up' ? '+' : ''}{selectedSource.change}%
                {selectedSource.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Conversion</div>
              <div className="text-xl font-bold text-gray-900">
                {(selectedSource.value * 0.032).toFixed(1)}%
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Device Breakdown */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Device Breakdown</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Monitor className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Desktop</div>
              <div className="text-xs text-gray-600">65%</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Mobile</div>
              <div className="text-xs text-gray-600">28%</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Tablet className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Tablet</div>
              <div className="text-xs text-gray-600">7%</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrafficSources;