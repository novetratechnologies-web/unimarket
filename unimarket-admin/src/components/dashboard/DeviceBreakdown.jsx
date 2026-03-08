// admin/src/components/dashboard/DeviceBreakdown.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Smartphone, Laptop, Tablet, Monitor, TrendingUp, ChevronDown } from 'lucide-react';

const DeviceBreakdown = ({ data = null, loading = false }) => {
  const [selectedDevice, setSelectedDevice] = useState(null);

  const defaultData = [
    { name: 'Desktop', value: 12500, percentage: 58, icon: Monitor, color: '#3B82F6' },
    { name: 'Mobile', value: 7200, percentage: 33, icon: Smartphone, color: '#8B5CF6' },
    { name: 'Tablet', value: 1900, percentage: 9, icon: Tablet, color: '#10B981' }
  ];

  const chartData = data || defaultData;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-[250px] bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <data.icon className="h-4 w-4 text-gray-600" />
            <p className="font-medium text-gray-900">{data.name}</p>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Visitors:</span>
              <span className="font-medium text-gray-900">{formatNumber(data.value)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Share:</span>
              <span className="font-medium text-gray-900">{data.percentage}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Conversion:</span>
              <span className="font-medium text-green-600">3.2%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary-600" />
            Device Breakdown
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            {formatNumber(total)} visitors across devices
          </p>
        </div>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
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
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              width={80}
              tickFormatter={(value) => value}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              onClick={(data) => setSelectedDevice(data)}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {chartData.map((device, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -2 }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedDevice?.name === device.name
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedDevice(device)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                selectedDevice?.name === device.name
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <device.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{device.name}</div>
                <div className="text-xs text-gray-500">{device.percentage}% share</div>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">{formatNumber(device.value)}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+12.5% vs last period</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected Device Details */}
      {selectedDevice && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 pt-6 border-t border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <selectedDevice.icon className="h-4 w-4" />
              {selectedDevice.name} Analytics
            </h4>
            <button
              onClick={() => setSelectedDevice(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Visitors</div>
              <div className="text-xl font-bold text-gray-900">
                {formatNumber(selectedDevice.value)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Bounce Rate</div>
              <div className="text-xl font-bold text-gray-900">42.3%</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Pages/Session</div>
              <div className="text-xl font-bold text-gray-900">3.2</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Avg. Session</div>
              <div className="text-xl font-bold text-gray-900">4m 32s</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DeviceBreakdown;