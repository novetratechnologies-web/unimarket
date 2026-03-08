// admin/src/components/dashboard/WelcomeBanner.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Rocket, 
  Target, 
  Trophy, 
  TrendingUp,
  ArrowRight,
  X,
  CheckCircle,
  Gift,
  Star,
  Zap,
  BookOpen,
  HelpCircle,
  Mail
} from 'lucide-react';

const WelcomeBanner = ({ user = null, onDismiss = null }) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const tips = [
    {
      icon: Rocket,
      title: 'Quick Start Guide',
      description: 'Get started with your admin dashboard in 5 minutes',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Target,
      title: 'Set Your Goals',
      description: 'Define your business targets and track progress',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Trophy,
      title: 'Achievements',
      description: 'Complete tasks to unlock achievements',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Gift,
      title: 'Welcome Bonus',
      description: 'Get 100 bonus points for completing your profile',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const quickStats = [
    { label: 'Products to add', value: '5', link: '/products/add' },
    { label: 'Complete profile', value: '60%', link: '/settings' },
    { label: 'New features', value: '3', link: '/changelog' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [tips.length]);

  const handleDismiss = () => {
    setShowBanner(false);
    if (dontShowAgain && onDismiss) {
      onDismiss();
      localStorage.setItem('hideWelcomeBanner', 'true');
    }
  };

  if (!showBanner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors z-10"
      >
        <X className="h-4 w-4 text-white" />
      </button>

      <div className="relative p-6 lg:p-8">
        {/* Welcome Message */}
        <div className="flex items-start gap-4 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">
              Welcome back, {user?.firstName || user?.name || 'Admin'}! 👋
            </h2>
            <p className="text-gray-400">
              You have {quickStats[0].value} items waiting for your attention
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tips Carousel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`bg-gradient-to-br ${tips[currentTip].color} rounded-xl p-6 text-white shadow-lg`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    {React.createElement(tips[currentTip].icon, { className: 'h-6 w-6' })}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{tips[currentTip].title}</h3>
                    <p className="text-white/90 text-sm mb-4">{tips[currentTip].description}</p>
                    <button className="flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all">
                      Learn more <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Carousel Indicators */}
                <div className="flex items-center gap-2 mt-4">
                  {tips.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTip(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentTip 
                          ? 'w-8 bg-white' 
                          : 'w-4 bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Quick Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Quick Stats
            </h3>
            <div className="space-y-4">
              {quickStats.map((stat, index) => (
                <a
                  key={index}
                  href={stat.link}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <span className="text-gray-300 text-sm">{stat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{stat.value}</span>
                    <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                </a>
              ))}
            </div>

            {/* Progress Ring */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Profile Completion</span>
                <span className="text-sm text-white font-medium">60%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: '60%' }}
                />
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white font-medium transition-colors">
                Complete Your Profile
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-white/10">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors">
            <BookOpen className="h-4 w-4" />
            Documentation
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors">
            <HelpCircle className="h-4 w-4" />
            Support
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors">
            <Mail className="h-4 w-4" />
            Feedback
          </button>
          
          {/* Don't show again checkbox */}
          <div className="ml-auto flex items-center gap-2">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="dontShowAgain" className="text-sm text-gray-400">
              Don't show again
            </label>
          </div>
        </div>

        {/* Achievement Badge */}
        <div className="absolute bottom-6 right-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
            <Star className="h-3 w-3 fill-yellow-300" />
            <span>3 achievements unlocked</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeBanner;