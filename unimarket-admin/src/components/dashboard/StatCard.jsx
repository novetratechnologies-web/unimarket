// admin/src/components/dashboard/StatCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, MoreVertical, Eye, EyeOff, Maximize2, Info } from 'lucide-react';

const StatCard = ({ 
  id,
  title, 
  value, 
  formattedValue, 
  change, 
  trend, 
  icon: Icon, 
  color, 
  bgColor,
  tooltip,
  sparkline,
  isHidden,
  onToggle,
  onFullscreen
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (isHidden) return null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all relative group"
    >
      {/* Card Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onFullscreen}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          title="Expand"
        >
          <Maximize2 className="h-4 w-4 text-gray-400" />
        </button>
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          title="Hide"
        >
          <EyeOff className="h-4 w-4 text-gray-400" />
        </button>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Info className="h-4 w-4 text-gray-400" />
          </button>
          {showTooltip && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 z-10">
              {tooltip}
            </div>
          )}
        </div>
      </div>

      {/* Icon */}
      <div className={`h-12 w-12 ${bgColor} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-gray-900 mb-1">{formattedValue}</div>
      
      {/* Title */}
      <div className="text-sm text-gray-600 mb-3">{title}</div>

      {/* Trend & Sparkline */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 text-sm font-medium ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>{trend === 'up' ? '+' : ''}{change}%</span>
        </div>

        {/* Sparkline (simplified) */}
        {sparkline && sparkline.length > 0 && (
          <div className="flex items-end gap-0.5 h-8">
            {sparkline.slice(-7).map((value, i) => (
              <div
                key={i}
                className="w-1 bg-primary-200 rounded-t"
                style={{ height: `${(value / Math.max(...sparkline)) * 24}px` }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;