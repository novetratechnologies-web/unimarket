// admin/src/components/dashboard/ProductCategories.jsx
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
import { Package, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Grid3x3, List } from 'lucide-react';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#06B6D4', '#D946EF', '#F43F5E', '#64748B', '#0EA5E9'
];

const ProductCategories = ({ data = [], loading = false }) => {
  const [viewMode, setViewMode] = useState('pie'); // 'pie' or 'bar'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('count'); // 'count' or 'value'

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
        <div className="h-[350px] bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  // Transform data if needed
  const chartData = Array.isArray(data) ? data : 
    data?.categories || data?.data || [];

  // Sort data
  const sortedData = [...chartData].sort((a, b) => {
    if (sortBy === 'count') {
      return (b.count || 0) - (a.count || 0);
    }
    return (b.totalValue || b.value || 0) - (a.totalValue || a.value || 0);
  });

  // Calculate totals
  const totalProducts = sortedData.reduce((sum, item) => sum + (item.count || 0), 0);
  const totalValue = sortedData.reduce((sum, item) => sum + (item.totalValue || item.value || 0), 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{data.name || data._id}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }} />
              <span className="text-gray-600">Products:</span>
              <span className="font-medium text-gray-900">{data.count || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Value:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(data.totalValue || data.value || 0)}
              </span>
            </div>
            {data.percentage && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600">Share:</span>
                <span className="font-medium text-gray-900">
                  {data.percentage.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    if (!payload) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        {payload.slice(0, 9).map((entry, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => setSelectedCategory(entry.payload)}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">
                {entry.payload.name || entry.payload._id}
              </div>
              <div className="text-xs text-gray-500">
                {entry.payload.count || 0} items
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-600" />
              Product Categories
            </h3>
            <p className="text-gray-600 text-sm mt-1">Products by category</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">No categories found</p>
          <p className="text-sm text-gray-500 mt-1">Add products to see category distribution</p>
        </div>
      </div>
    );
  }

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
            <Package className="h-5 w-5 text-primary-600" />
            Product Categories
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            {totalProducts} products • {formatCurrency(totalValue)} total value
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="count">Sort by Count</option>
            <option value="value">Sort by Value</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('pie')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'pie' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
              title="Pie Chart"
            >
              <PieChart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'bar' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
              title="Bar Chart"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'pie' ? (
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey={sortBy === 'count' ? 'count' : 'totalValue'}
                nameKey="_id"
                label={({ name, percent }) => 
                  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                }
                labelLine={false}
              >
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => setSelectedCategory(entry)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          ) : (
            <BarChart
              data={sortedData.slice(0, 10)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                type="number"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(value) => 
                  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
                }
              />
              <YAxis 
                type="category"
                dataKey="_id"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey={sortBy === 'count' ? 'count' : 'totalValue'} 
                radius={[0, 4, 4, 0]}
              >
                {sortedData.slice(0, 10).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => setSelectedCategory(entry)}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Selected Category Details */}
      {selectedCategory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 pt-6 border-t border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              {selectedCategory.name || selectedCategory._id}
            </h4>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Products</div>
              <div className="text-xl font-bold text-gray-900">
                {selectedCategory.count || 0}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Total Value</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(selectedCategory.totalValue || selectedCategory.value || 0)}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Avg. Price</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(
                  (selectedCategory.totalValue || selectedCategory.value || 0) / 
                  (selectedCategory.count || 1)
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Share</div>
              <div className="text-xl font-bold text-gray-900">
                {((selectedCategory.count || 0) / totalProducts * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => window.location.href = `/admin/products?category=${selectedCategory._id}`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              View Products
            </button>
            <button
              onClick={() => {
                // Handle export
                console.log('Export category:', selectedCategory);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Export Data
            </button>
          </div>
        </motion.div>
      )}

      {/* Summary Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-gray-600">Top category:</span>
            <span className="font-medium text-gray-900">
              {sortedData[0]?.name || sortedData[0]?._id}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Count</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Value</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCategories;