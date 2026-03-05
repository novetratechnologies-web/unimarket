// admin/src/pages/inventory/components/InventoryStats.jsx
import React from 'react';
import {
  FiPackage,
  FiDollarSign,
  FiAlertCircle,
  FiTrendingDown,
  FiShoppingBag,
  FiBox,
  FiClock,
  FiTrendingUp,
  FiPercent,
  FiBarChart2
} from 'react-icons/fi';

const InventoryStats = ({ stats }) => {
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

  // Calculate profit margin
  const calculateProfitMargin = () => {
    if (!stats.totalValue || !stats.totalCost || stats.totalValue === 0) return 0;
    return ((stats.totalValue - stats.totalCost) / stats.totalValue) * 100;
  };

  // Calculate potential profit
  const calculatePotentialProfit = () => {
    return (stats.totalValue || 0) - (stats.totalCost || 0);
  };

  const statCards = [
    {
      title: 'Total Products',
      value: formatNumber(stats.totalProducts),
      icon: FiPackage,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      description: 'Active products in inventory'
    },
    {
      title: 'Total Value',
      value: formatCurrency(stats.totalValue),
      icon: FiDollarSign,
      color: 'bg-green-500',
      bg: 'bg-green-50',
      text: 'text-green-600',
      description: 'Total retail value'
    },
    {
      title: 'Total Cost',
      value: formatCurrency(stats.totalCost),
      icon: FiShoppingBag,
      color: 'bg-purple-500',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      description: 'Total cost of goods'
    },
    {
      title: 'Profit Margin',
      value: `${calculateProfitMargin().toFixed(1)}%`,
      icon: FiPercent,
      color: 'bg-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      description: 'Average profit margin',
      tooltip: `Potential profit: ${formatCurrency(calculatePotentialProfit())}`
    },
    {
      title: 'Total Quantity',
      value: formatNumber(stats.totalQuantity),
      icon: FiBox,
      color: 'bg-indigo-500',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      description: 'Total units in stock'
    },
    {
      title: 'Low Stock',
      value: formatNumber(stats.lowStockCount),
      icon: FiAlertCircle,
      color: 'bg-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      description: 'Products below threshold',
      urgent: stats.lowStockCount > 0
    },
    {
      title: 'Out of Stock',
      value: formatNumber(stats.outOfStockCount),
      icon: FiTrendingDown,
      color: 'bg-rose-500',
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      description: 'Products with zero stock',
      urgent: stats.outOfStockCount > 0
    },
    {
      title: 'Active Products',
      value: formatNumber(stats.activeProducts),
      icon: FiClock,
      color: 'bg-teal-500',
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      description: 'Currently active products'
    }
  ];

  // Calculate totals for summary
  const totalItems = statCards.length;
  const urgentCount = statCards.filter(card => card.urgent).length;

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FiBarChart2 className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Inventory Summary</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Total Items:</span>
              <span className="text-sm font-semibold text-gray-900">{totalItems}</span>
            </div>
            {urgentCount > 0 && (
              <div className="flex items-center">
                <span className="text-xs text-red-500 mr-2">Alerts:</span>
                <span className="text-sm font-semibold text-red-600">{urgentCount}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Last updated: {new Date().toLocaleTimeString('en-KE')}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isUrgent = stat.urgent;

          return (
            <div
              key={index}
              className={`group relative bg-white rounded-xl shadow-sm border ${
                isUrgent ? 'border-red-200' : 'border-gray-200'
              } p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-help`}
              title={stat.tooltip || stat.description}
            >
              {/* Urgent indicator */}
              {isUrgent && (
                <div className="absolute -top-1 -right-1 w-3 h-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    {stat.title}
                    {isUrgent && (
                      <FiAlertCircle className="w-3 h-3 text-red-500 ml-1" />
                    )}
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${
                    isUrgent ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {stat.value}
                  </p>
                  
                  {/* Mini progress indicator for low stock */}
                  {stat.title === 'Low Stock' && stats.lowStockCount > 0 && (
                    <div className="mt-2 flex items-center">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full"
                          style={{ 
                            width: `${Math.min((stats.lowStockCount / (stats.totalProducts || 1)) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {((stats.lowStockCount / (stats.totalProducts || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {/* Description tooltip indicator */}
                  <p className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {stat.description}
                  </p>
                </div>
                
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${stat.text}`} />
                </div>
              </div>
              
              {/* Colored bar */}
              <div className="mt-4">
                <div className={`h-1 ${stat.color} rounded-full transition-all duration-300 group-hover:w-full`} style={{ width: isUrgent ? '80%' : '60%' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        {/* Stock Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Stock Health
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">In Stock</span>
              <span className="text-sm font-medium text-green-600">
                {formatNumber((stats.totalProducts || 0) - (stats.outOfStockCount || 0))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Low Stock</span>
              <span className="text-sm font-medium text-amber-600">
                {formatNumber(stats.lowStockCount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Out of Stock</span>
              <span className="text-sm font-medium text-red-600">
                {formatNumber(stats.outOfStockCount)}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Financial Overview
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Potential Profit</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(calculatePotentialProfit())}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Value/Product</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency((stats.totalValue || 0) / (stats.totalProducts || 1))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Cost/Product</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency((stats.totalCost || 0) / (stats.totalProducts || 1))}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Turnover */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Inventory Efficiency
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Stock to Value Ratio</span>
              <span className="text-sm font-medium text-indigo-600">
                {(stats.totalQuantity / (stats.totalValue || 1)).toFixed(3)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Ratio</span>
              <span className="text-sm font-medium text-teal-600">
                {((stats.activeProducts || 0) / (stats.totalProducts || 1) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cost/Value Ratio</span>
              <span className="text-sm font-medium text-purple-600">
                {((stats.totalCost || 0) / (stats.totalValue || 1) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryStats;