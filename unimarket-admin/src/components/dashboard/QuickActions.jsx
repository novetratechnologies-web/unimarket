// admin/src/components/dashboard/QuickActions.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const QuickActions = ({ actions }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        <span className="text-xs text-gray-500">Keyboard shortcuts available</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            className="group relative p-4 rounded-xl border border-gray-200 hover:border-transparent hover:shadow-lg transition-all text-left"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity`} />
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${action.color} bg-opacity-10 flex items-center justify-center mb-3`}>
              <action.icon className="h-5 w-5 text-white" />
            </div>
            <div className="font-medium text-gray-900 text-sm mb-1">{action.label}</div>
            <div className="text-xs text-gray-500">{action.description}</div>
            {action.shortcut && (
              <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {action.shortcut}
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;