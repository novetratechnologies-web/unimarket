// ============================================
// components/dashboard/GoalProgress.jsx
// ============================================
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Star,
  Calendar,
  Edit2,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  Rocket,
  Sparkles
} from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { useInView } from 'react-intersection-observer';

// ============================================
// CONSTANTS
// ============================================
const GOAL_ICONS = {
  revenue: DollarSign,
  orders: ShoppingCart,
  customers: Users,
  products: Package,
  satisfaction: Star,
  default: Target
};

const GOAL_COLORS = {
  revenue: {
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    light: 'bg-emerald-50',
    text: 'text-emerald-600',
    progress: 'bg-emerald-500',
    icon: 'text-emerald-500'
  },
  orders: {
    bg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    progress: 'bg-blue-500',
    icon: 'text-blue-500'
  },
  customers: {
    bg: 'bg-gradient-to-br from-purple-500 to-pink-500',
    light: 'bg-purple-50',
    text: 'text-purple-600',
    progress: 'bg-purple-500',
    icon: 'text-purple-500'
  },
  products: {
    bg: 'bg-gradient-to-br from-orange-500 to-red-500',
    light: 'bg-orange-50',
    text: 'text-orange-600',
    progress: 'bg-orange-500',
    icon: 'text-orange-500'
  },
  satisfaction: {
    bg: 'bg-gradient-to-br from-yellow-500 to-amber-500',
    light: 'bg-yellow-50',
    text: 'text-yellow-600',
    progress: 'bg-yellow-500',
    icon: 'text-yellow-500'
  },
  default: {
    bg: 'bg-gradient-to-br from-gray-500 to-slate-500',
    light: 'bg-gray-50',
    text: 'text-gray-600',
    progress: 'bg-gray-500',
    icon: 'text-gray-500'
  }
};

const TIME_FRAMES = {
  daily: { label: 'Daily', days: 1 },
  weekly: { label: 'Weekly', days: 7 },
  monthly: { label: 'Monthly', days: 30 },
  quarterly: { label: 'Quarterly', days: 90 },
  yearly: { label: 'Yearly', days: 365 }
};

// ============================================
// PROGRESS BAR COMPONENT
// ============================================
const ProgressBar = ({ progress, color = 'bg-primary-500', animated = true }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <div ref={ref} className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: `${Math.min(progress, 100)}%` } : { width: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full ${color} ${animated ? 'relative' : ''}`}
      >
        {animated && progress > 0 && (
          <motion.div
            className="absolute inset-0 bg-white/30"
            animate={{
              x: ['0%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              width: '30%',
              transform: 'skewX(-20deg)'
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

// ============================================
// GOAL CARD COMPONENT
// ============================================
const GoalCard = ({ goal, onEdit, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const Icon = GOAL_ICONS[goal.type] || GOAL_ICONS.default;
  const colors = GOAL_COLORS[goal.type] || GOAL_COLORS.default;
  
  const progress = Math.min((goal.current / goal.target) * 100, 100);
  const remaining = Math.max(goal.target - goal.current, 0);
  
  const daysLeft = useMemo(() => {
    if (!goal.deadline) return null;
    const days = differenceInDays(new Date(goal.deadline), new Date());
    return days;
  }, [goal.deadline]);
  
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
  const isCompleted = goal.current >= goal.target;
  
  const formatValue = (value, type) => {
    switch (type) {
      case 'revenue':
      case 'profit':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'rating':
        return `${value.toFixed(1)}/5`;
      default:
        return new Intl.NumberFormat('en-US', {
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer"
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Status Indicator */}
      {isCompleted && (
        <div className="absolute top-3 right-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-green-500 rounded-full p-1"
          >
            <CheckCircle className="h-4 w-4 text-white" />
          </motion.div>
        </div>
      )}
      
      {isOverdue && !isCompleted && (
        <div className="absolute top-3 right-3">
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            Overdue
          </div>
        </div>
      )}
      
      {isUrgent && !isCompleted && !isOverdue && (
        <div className="absolute top-3 right-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium"
          >
            Urgent
          </motion.div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`h-12 w-12 rounded-xl ${colors.light} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">
              {goal.title}
            </h4>
            <p className="text-sm text-gray-500 mt-0.5">
              {goal.description || `${goal.type} target`}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">
              {formatValue(goal.current, goal.type)} / {formatValue(goal.target, goal.type)}
            </span>
          </div>
          <ProgressBar progress={progress} color={colors.progress} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Remaining</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatValue(remaining, goal.type)}
            </div>
          </div>
          
          {goal.deadline && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Deadline</div>
              <div className={`text-sm font-semibold flex items-center gap-1 ${
                isOverdue ? 'text-red-600' : isUrgent ? 'text-yellow-600' : 'text-gray-900'
              }`}>
                <Clock className="h-3 w-3" />
                {format(new Date(goal.deadline), 'MMM d')}
                {daysLeft !== null && !isCompleted && (
                  <span className="text-xs text-gray-500">
                    ({Math.abs(daysLeft)}d {isOverdue ? 'ago' : 'left'})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              {goal.category || 'General'}
            </div>
            {goal.priority === 'high' && (
              <div className="text-xs font-medium px-2 py-1 bg-red-100 text-red-600 rounded-full">
                High Priority
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onEdit && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(goal);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit2 className="h-4 w-4 text-gray-400" />
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ x: 3 }}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(goal);
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 bg-gray-50 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Milestones */}
              {goal.milestones && goal.milestones.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Milestones
                  </h5>
                  <div className="space-y-2">
                    {goal.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className="text-xs text-gray-600 flex-1">{milestone.name}</span>
                        <span className="text-xs text-gray-500">
                          {milestone.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical Data */}
              {goal.history && goal.history.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Recent Performance
                  </h5>
                  <div className="space-y-1">
                    {goal.history.slice(-3).map((point, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-500">
                          {format(new Date(point.date), 'MMM d')}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatValue(point.value, goal.type)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  View Report
                </button>
                <button className="flex-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors">
                  Update Progress
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover Effect Overlay */}
      <AnimatePresence>
        {isHovered && !showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const GoalProgress = ({ 
  goals = [],
  onEdit,
  onViewDetails,
  onAddGoal,
  className = '',
  showHeader = true,
  compact = false
}) => {
  const [filter, setFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('monthly');
  const [sortBy, setSortBy] = useState('progress');
  const [viewMode, setViewMode] = useState('grid');

  // Filter and sort goals
  const filteredGoals = useMemo(() => {
    let filtered = [...goals];

    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(g => g.current < g.target);
    } else if (filter === 'completed') {
      filtered = filtered.filter(g => g.current >= g.target);
    } else if (filter === 'overdue') {
      filtered = filtered.filter(g => {
        if (!g.deadline) return false;
        return g.current < g.target && differenceInDays(new Date(g.deadline), new Date()) < 0;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'progress') {
        const progressA = (a.current / a.target) * 100;
        const progressB = (b.current / b.target) * 100;
        return progressB - progressA;
      } else if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      } else if (sortBy === 'target') {
        return b.target - a.target;
      }
      return 0;
    });

    return filtered;
  }, [goals, filter, sortBy]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    
    const total = goals.reduce((sum, goal) => sum + goal.target, 0);
    const current = goals.reduce((sum, goal) => sum + Math.min(goal.current, goal.target), 0);
    
    return (current / total) * 100;
  }, [goals]);

  // Count goals by status
  const counts = useMemo(() => ({
    total: goals.length,
    completed: goals.filter(g => g.current >= g.target).length,
    active: goals.filter(g => g.current < g.target).length,
    overdue: goals.filter(g => {
      if (!g.deadline) return false;
      return g.current < g.target && differenceInDays(new Date(g.deadline), new Date()) < 0;
    }).length
  }), [goals]);

  if (goals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-8 ${className}`}
      >
        <div className="text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Set</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Set goals to track your progress and keep your team motivated towards achieving targets.
          </p>
          {onAddGoal && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddGoal}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Create Your First Goal
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Goal Progress</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Track and manage your team's objectives
                </p>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {overallProgress.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Overall Progress</div>
              </div>
              <div className="w-32">
                <ProgressBar progress={overallProgress} color="bg-purple-500" />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
              <div className="text-xs text-gray-500 mt-1">Total Goals</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600">{counts.completed}</div>
              <div className="text-xs text-green-600 mt-1">Completed</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600">{counts.active}</div>
              <div className="text-xs text-blue-600 mt-1">In Progress</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-600">{counts.overdue}</div>
              <div className="text-xs text-red-600 mt-1">Overdue</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'active' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'completed' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter('overdue')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'overdue' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Overdue
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Timeframe Filter */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(TIME_FRAMES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="progress">Progress</option>
                <option value="deadline">Deadline</option>
                <option value="target">Target</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-1.5 h-1.5 bg-current rounded-sm" />
                    <div className="w-1.5 h-1.5 bg-current rounded-sm" />
                    <div className="w-1.5 h-1.5 bg-current rounded-sm" />
                    <div className="w-1.5 h-1.5 bg-current rounded-sm" />
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="w-3 h-0.5 bg-current rounded-sm" />
                    <div className="w-3 h-0.5 bg-current rounded-sm" />
                    <div className="w-3 h-0.5 bg-current rounded-sm" />
                  </div>
                </button>
              </div>

              {/* Add Goal Button */}
              {onAddGoal && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onAddGoal}
                  className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  Add Goal
                </motion.button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {compact ? (
        // Compact view for sidebar/widget
        <div className="space-y-3">
          {filteredGoals.slice(0, 5).map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={onEdit}
              onViewDetails={onViewDetails}
            />
          ))}
          {filteredGoals.length > 5 && (
            <button className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
              View {filteredGoals.length - 5} more goals
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={onEdit}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      ) : (
        // List view
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Goal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGoals.map((goal) => {
                const Icon = GOAL_ICONS[goal.type] || GOAL_ICONS.default;
                const colors = GOAL_COLORS[goal.type] || GOAL_COLORS.default;
                const progress = (goal.current / goal.target) * 100;
                
                return (
                  <motion.tr
                    key={goal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                    className="cursor-pointer"
                    onClick={() => onViewDetails?.(goal)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg ${colors.light} flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${colors.icon}`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{goal.title}</div>
                          <div className="text-sm text-gray-500">{goal.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <ProgressBar progress={progress} color={colors.progress} animated={false} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {goal.current} / {goal.target}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {goal.deadline ? format(new Date(goal.deadline), 'MMM d, yyyy') : 'No deadline'}
                    </td>
                    <td className="px-6 py-4">
                      {goal.current >= goal.target ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Completed
                        </span>
                      ) : goal.deadline && new Date(goal.deadline) < new Date() ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          Overdue
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(goal);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4 text-gray-400" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GoalProgress;