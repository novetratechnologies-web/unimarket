// admin/src/pages/inventory/components/InventoryChart.jsx
import React, { useState, useEffect } from 'react';
import {
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiRefreshCw,
  FiDownload,
  FiMaximize2,
  FiMinimize2,
  FiInfo
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const InventoryChart = ({
  data,
  type = 'line',
  title = 'Inventory Overview',
  period = 'monthly',
  onPeriodChange,
  onRefresh,
  onExport,
  height = 400,
  showControls = true,
  loading = false,
  currency = 'KES'
}) => {
  const [chartType, setChartType] = useState(type);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('quantity');
  const [hoveredData, setHoveredData] = useState(null);
  const [showLegend, setShowLegend] = useState(true);

  // Format currency in KES
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-KE').format(value || 0);
  };

  const metrics = [
    { value: 'quantity', label: 'Stock Quantity', color: '#6366f1' },
    { value: 'value', label: 'Stock Value (KES)', color: '#10b981' },
    { value: 'incoming', label: 'Incoming Stock', color: '#f59e0b' },
    { value: 'outgoing', label: 'Outgoing Stock', color: '#ef4444' },
    { value: 'turnover', label: 'Turnover Rate', color: '#8b5cf6' },
    { value: 'profit', label: 'Profit Margin', color: '#ec4899' }
  ];

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const colors = {
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#8b5cf6',
    gray: '#9ca3af',
    purple: '#8b5cf6',
    pink: '#ec4899'
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
          <p className="text-sm font-medium text-gray-900 mb-2 border-b pb-2">{label}</p>
          {payload.map((entry, index) => {
            const isValueMetric = entry.name.includes('Value') || entry.name.includes('KES');
            const isProfitMetric = entry.name.includes('Profit');
            
            return (
              <div key={index} className="flex items-center justify-between text-xs mb-2 last:mb-0">
                <div className="flex items-center">
                  <span 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600">{entry.name}:</span>
                </div>
                <span className="font-medium text-gray-900 ml-4">
                  {isValueMetric || isProfitMetric 
                    ? formatCurrency(entry.value)
                    : formatNumber(entry.value)
                  }
                </span>
              </div>
            );
          })}
          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
            Click to view details
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <FiBarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No data available</p>
            <button
              onClick={onRefresh}
              className="mt-4 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <FiRefreshCw className="w-3 h-3 inline mr-2" />
              Refresh Data
            </button>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data} 
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              onClick={(e) => console.log('Chart clicked:', e)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => {
                  if (selectedMetric === 'value' || selectedMetric === 'profit') {
                    return `KES ${(value / 1000).toFixed(0)}k`;
                  }
                  return formatNumber(value);
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey={selectedMetric}
                name={metrics.find(m => m.value === selectedMetric)?.label || selectedMetric}
                stroke={metrics.find(m => m.value === selectedMetric)?.color || colors.primary}
                strokeWidth={2}
                dot={{ r: 4, fill: metrics.find(m => m.value === selectedMetric)?.color || colors.primary }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
              {selectedMetric === 'quantity' && (
                <Line 
                  type="monotone" 
                  dataKey="threshold" 
                  name="Threshold"
                  stroke={colors.warning} 
                  strokeDasharray="5 5" 
                  strokeWidth={1.5}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => {
                  if (selectedMetric === 'value' || selectedMetric === 'profit') {
                    return `KES ${(value / 1000).toFixed(0)}k`;
                  }
                  return formatNumber(value);
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Bar
                dataKey={selectedMetric}
                name={metrics.find(m => m.value === selectedMetric)?.label || selectedMetric}
                fill={metrics.find(m => m.value === selectedMetric)?.color || colors.primary}
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => {
                  if (selectedMetric === 'value' || selectedMetric === 'profit') {
                    return `KES ${(value / 1000).toFixed(0)}k`;
                  }
                  return formatNumber(value);
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey={selectedMetric}
                name={metrics.find(m => m.value === selectedMetric)?.label || selectedMetric}
                stroke={metrics.find(m => m.value === selectedMetric)?.color || colors.primary}
                fill={metrics.find(m => m.value === selectedMetric)?.color || colors.primary}
                fillOpacity={0.3}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={isFullscreen ? 150 : 80}
                fill="#8884d8"
                dataKey={selectedMetric}
                nameKey="name"
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || colors.primary}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.div
      variants={chartVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      }`}
      style={{ height: isFullscreen ? 'auto' : height }}
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {chartType === 'pie' ? (
              <FiPieChart className="w-5 h-5 text-indigo-600 mr-2" />
            ) : (
              <FiBarChart2 className="w-5 h-5 text-indigo-600 mr-2" />
            )}
            <h4 className="text-md font-medium text-gray-900">{title}</h4>
            {loading && (
              <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                <FiRefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Updating
              </span>
            )}
          </div>

          {showControls && (
            <div className="flex items-center space-x-3">
              {/* Metric Selector */}
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {metrics.map(metric => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label}
                  </option>
                ))}
              </select>

              {/* Period Selector */}
              <select
                value={period}
                onChange={(e) => onPeriodChange?.(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {periods.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>

              {/* Chart Type Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartType('line')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    chartType === 'line' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="Line Chart"
                >
                  <FiTrendingUp className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    chartType === 'bar' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="Bar Chart"
                >
                  <FiBarChart2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    chartType === 'area' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="Area Chart"
                >
                  <FiTrendingDown className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    chartType === 'pie' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="Pie Chart"
                >
                  <FiPieChart className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Legend Toggle */}
              <button
                onClick={() => setShowLegend(!showLegend)}
                className={`p-2 rounded-lg transition-colors ${
                  showLegend ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Toggle Legend"
              >
                <FiInfo className="w-4 h-4" />
              </button>

              {/* Actions */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={onRefresh}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh"
                  disabled={loading}
                >
                  <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onExport}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Export Data"
                >
                  <FiDownload className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <FiMinimize2 className="w-4 h-4" />
                  ) : (
                    <FiMaximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {data && data.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-xs text-indigo-600 mb-1">Total Quantity</p>
              <p className="text-lg font-bold text-indigo-700">
                {formatNumber(data.reduce((sum, item) => sum + (item.quantity || 0), 0))}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600 mb-1">Total Value</p>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(data.reduce((sum, item) => sum + (item.value || 0), 0))}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-600 mb-1">Avg. Quantity</p>
              <p className="text-lg font-bold text-amber-700">
                {formatNumber(Math.round(data.reduce((sum, item) => sum + (item.quantity || 0), 0) / data.length))}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-600 mb-1">Low Stock Items</p>
              <p className="text-lg font-bold text-purple-700">
                {formatNumber(data.filter(item => (item.quantity || 0) <= (item.threshold || 5)).length)}
              </p>
            </div>
            <div className="bg-rose-50 rounded-lg p-3">
              <p className="text-xs text-rose-600 mb-1">Out of Stock</p>
              <p className="text-lg font-bold text-rose-700">
                {formatNumber(data.filter(item => (item.quantity || 0) === 0).length)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="p-6" style={{ height: isFullscreen ? 'calc(100vh - 280px)' : height - 180 }}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Loading chart data...</p>
            </div>
          </div>
        ) : (
          renderChart()
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <FiCalendar className="w-3 h-3 mr-1" />
            <span>Last updated: {new Date().toLocaleString('en-KE')}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1" />
              <span>Quantity</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />
              <span>Value (KES)</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-1" />
              <span>Threshold</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Sample Data Generator (for testing)
export const generateSampleInventoryData = (period = 'monthly', currency = 'KES') => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  let labels;
  switch (period) {
    case 'daily':
      labels = days;
      break;
    case 'weekly':
      labels = weeks;
      break;
    case 'monthly':
      labels = months;
      break;
    default:
      labels = months.slice(0, 6);
  }

  return labels.map(label => ({
    name: label,
    quantity: Math.floor(Math.random() * 1000) + 100,
    value: Math.floor(Math.random() * 500000) + 50000, // KES values
    incoming: Math.floor(Math.random() * 200) + 50,
    outgoing: Math.floor(Math.random() * 150) + 30,
    turnover: Math.random() * 3 + 0.5,
    profit: Math.floor(Math.random() * 100000) + 10000,
    threshold: 200,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`
  }));
};

export default InventoryChart;