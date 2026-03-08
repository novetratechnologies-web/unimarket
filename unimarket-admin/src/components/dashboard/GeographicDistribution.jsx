// admin/src/components/dashboard/GeographicDistribution.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  MapPin, 
  TrendingUp, 
  ChevronDown,
  Users,
  ShoppingCart,
  DollarSign
} from 'lucide-react';
import { ResponsiveChoropleth } from '@nivo/geo';
import worldCountries from 'world-countries';

// Transform world-countries data to Nivo format
const countries = worldCountries.map(country => ({
  id: country.cca3,
  value: Math.floor(Math.random() * 1000) + 100, // Random data for demo
  name: country.name.common
}));

const GeographicDistribution = ({ data = null, loading = false }) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [sortBy, setSortBy] = useState('value');

  // Sample data - replace with your actual API data
  const sampleData = [
    { id: 'USA', value: 15420, name: 'United States', visitors: 15420, orders: 485, revenue: 48500, growth: 12.5, trend: 'up' },
    { id: 'GBR', value: 8340, name: 'United Kingdom', visitors: 8340, orders: 267, revenue: 26700, growth: 8.3, trend: 'up' },
    { id: 'CAN', value: 6720, name: 'Canada', visitors: 6720, orders: 201, revenue: 20100, growth: 5.7, trend: 'up' },
    { id: 'DEU', value: 5410, name: 'Germany', visitors: 5410, orders: 162, revenue: 16200, growth: -2.1, trend: 'down' },
    { id: 'AUS', value: 4890, name: 'Australia', visitors: 4890, orders: 147, revenue: 14700, growth: 15.2, trend: 'up' },
    { id: 'FRA', value: 4230, name: 'France', visitors: 4230, orders: 127, revenue: 12700, growth: 3.4, trend: 'up' },
    { id: 'IND', value: 3890, name: 'India', visitors: 3890, orders: 116, revenue: 11600, growth: 22.1, trend: 'up' },
    { id: 'BRA', value: 3450, name: 'Brazil', visitors: 3450, orders: 103, revenue: 10300, growth: 7.8, trend: 'up' },
    { id: 'JPN', value: 3120, name: 'Japan', visitors: 3120, orders: 93, revenue: 9300, growth: 4.2, trend: 'up' },
    { id: 'CHN', value: 2980, name: 'China', visitors: 2980, orders: 89, revenue: 8900, growth: 11.3, trend: 'up' }
  ];

  const chartData = data || sampleData;
  const total = chartData.reduce((sum, item) => sum + (item.visitors || item.value || 0), 0);
  const totalOrders = chartData.reduce((sum, item) => sum + (item.orders || 0), 0);
  const totalRevenue = chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);

  // Sort data
  const sortedData = [...chartData].sort((a, b) => {
    if (sortBy === 'value') return (b.visitors || b.value) - (a.visitors || a.value);
    if (sortBy === 'growth') return (b.growth || 0) - (a.growth || 0);
    return 0;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse"></div>
        <div className="mt-4 space-y-2">
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
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
            Geographic Distribution
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            {formatNumber(total)} visitors from {chartData.length} regions
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSortBy('value')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'value'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Visitors
          </button>
          <button
            onClick={() => setSortBy('growth')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'growth'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Growth
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-sm text-blue-600 mb-1">Total Visitors</div>
          <div className="text-xl font-bold text-gray-900">{formatNumber(total)}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-sm text-green-600 mb-1">Total Orders</div>
          <div className="text-xl font-bold text-gray-900">{formatNumber(totalOrders)}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-sm text-purple-600 mb-1">Total Revenue</div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
        </div>
      </div>

      {/* World Map */}
      <div className="h-[300px] mb-6 bg-gray-50 rounded-xl overflow-hidden">
        <ResponsiveChoropleth
          data={chartData}
          features={worldCountries.map(country => ({
            id: country.cca3,
            ...country
          }))}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          colors="nivo"
          domain={[0, Math.max(...chartData.map(d => d.visitors || d.value))]}
          unknownColor="#E5E7EB"
          label="properties.name"
          valueFormat=".2s"
          projectionScale={120}
          projectionTranslation={[0.5, 0.5]}
          projectionRotation={[0, 0, 0]}
          enableGraticule={true}
          graticuleLineColor="#DDDDDD"
          borderWidth={0.5}
          borderColor="#FFFFFF"
          tooltip={({ feature }) => {
            const countryData = chartData.find(d => d.id === feature.id);
            if (!countryData) return null;
            return (
              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <div className="font-medium text-gray-900">{countryData.name || feature.properties.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Visitors: {formatNumber(countryData.visitors || countryData.value)}
                </div>
                {countryData.orders && (
                  <div className="text-sm text-gray-600">Orders: {formatNumber(countryData.orders)}</div>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Countries List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedData.map((country, index) => (
          <motion.div
            key={country.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedCountry?.id === country.id
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 hover:border-primary-300 hover:shadow-md hover:bg-gray-50'
            }`}
            onClick={() => setSelectedCountry(
              selectedCountry?.id === country.id ? null : country
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className={`h-4 w-4 ${
                  selectedCountry?.id === country.id ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <div>
                  <div className="font-medium text-gray-900">{country.name}</div>
                  <div className="text-xs text-gray-500">{country.id}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {formatNumber(country.visitors || country.value)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(((country.visitors || country.value) / total) * 100).toFixed(1)}%
                  </div>
                </div>
                {country.growth && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    country.trend === 'up' ? 'text-green-600' : 
                    country.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {country.trend === 'up' ? '+' : ''}{country.growth}%
                  </div>
                )}
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                  selectedCountry?.id === country.id ? 'rotate-180' : ''
                }`} />
              </div>
            </div>

            {/* Expanded Details */}
            {selectedCountry?.id === country.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-gray-200"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-2">
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <ShoppingCart className="h-3 w-3" />
                      Orders
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatNumber(country.orders)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <DollarSign className="h-3 w-3" />
                      Revenue
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(country.revenue)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <Users className="h-3 w-3" />
                      Conv.
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {((country.orders / (country.visitors || country.value)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Top region:</span>
            <span className="font-medium text-gray-900">
              {sortedData[0]?.name} ({((sortedData[0]?.visitors || sortedData[0]?.value) / total * 100).toFixed(1)}%)
            </span>
          </div>
          <button
            onClick={() => {
              // Handle export
              console.log('Export geographic data');
            }}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Export Data →
          </button>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </motion.div>
  );
};

export default GeographicDistribution;