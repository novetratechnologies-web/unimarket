// components/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home,
  TrendingUp,
  Package,
  ShoppingBag,
  BookOpen,
  Laptop,
  Shirt,
  Sofa,
  Home as HostelIcon,
  Store,
  Sparkles,
  Zap,
  Percent,
  Gift,
  Heart,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  X,
  GraduationCap,
  Smartphone,
  Headphones,
  Watch,
  Camera,
  Dumbbell,
  Gamepad2,
  Search,
  Coffee,
  Car,
  Palette,
  Music,
  Award,
  Clock,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/index';

// Modern category icons mapping
const categoryIcons = {
  electronics: <Laptop className="w-5 h-5" />,
  smartphones: <Smartphone className="w-5 h-5" />,
  computers: <Laptop className="w-5 h-5" />,
  gaming: <Gamepad2 className="w-5 h-5" />,
  cameras: <Camera className="w-5 h-5" />,
  fashion: <Shirt className="w-5 h-5" />,
  clothing: <Shirt className="w-5 h-5" />,
  shoes: <Watch className="w-5 h-5" />,
  accessories: <Watch className="w-5 h-5" />,
  home: <Sofa className="w-5 h-5" />,
  furniture: <Sofa className="w-5 h-5" />,
  kitchen: <Coffee className="w-5 h-5" />,
  garden: <Sofa className="w-5 h-5" />,
  books: <BookOpen className="w-5 h-5" />,
  textbooks: <BookOpen className="w-5 h-5" />,
  sports: <Dumbbell className="w-5 h-5" />,
  fitness: <Dumbbell className="w-5 h-5" />,
  automotive: <Car className="w-5 h-5" />,
  toys: <Gamepad2 className="w-5 h-5" />,
  music: <Music className="w-5 h-5" />,
  art: <Palette className="w-5 h-5" />,
  beauty: <Sparkles className="w-5 h-5" />,
  health: <Heart className="w-5 h-5" />,
  gifts: <Gift className="w-5 h-5" />,
  deals: <Percent className="w-5 h-5" />,
  default: <Package className="w-5 h-5" />
};

const Sidebar = ({ isOpen, onClose, user, onLogout }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryStack, setCategoryStack] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch categories from backend using tree endpoint
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      console.log('📡 Fetching category tree for sidebar...');
      try {
        const response = await api.categories.getCategoryTree({ depth: 10 });
        return response?.data || [];
      } catch (error) {
        console.error('❌ Failed to fetch categories:', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    enabled: isOpen // Only fetch when sidebar is open
  });

  // Close sidebar on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
      setActiveCategory(null);
      setCategoryStack([]);
    }
  }, [location.pathname]);

  // Handle click outside with proper event handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isOpen) {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  // Handle sidebar content click - prevent closing
  const handleSidebarClick = (e) => {
    e.stopPropagation();
  };

  // Navigate to category and close sidebar
  const handleCategoryClick = (category) => {
    onClose();
    navigate(`/category/${category.slug}`);
  };

  // Handle category navigation in sidebar
  const handleCategoryNav = (category) => {
    if (category.children?.length > 0) {
      setCategoryStack([...categoryStack, category]);
      setActiveCategory(category);
    } else {
      handleCategoryClick(category);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    const newStack = categoryStack.slice(0, -1);
    setCategoryStack(newStack);
    setActiveCategory(newStack.length > 0 ? newStack[newStack.length - 1] : null);
  };

  // Get current view categories
  const getCurrentCategories = () => {
    if (categoryStack.length === 0) {
      return categories;
    }
    return activeCategory?.children || [];
  };

  // Get icon for category
  const getCategoryIcon = (category) => {
    if (category?.iconImage?.url) {
      return <img src={category.iconImage.url} alt={category.name} className="w-5 h-5 object-contain" />;
    }
    
    const categoryName = category.name?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (categoryName.includes(key)) {
        return icon;
      }
    }
    return categoryIcons.default;
  };

  // Get gradient color based on index
  const getGradient = (index) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-amber-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500',
      'from-teal-500 to-green-500',
    ];
    return gradients[index % gradients.length];
  };

  // Filter categories by search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.children?.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get current categories to display
  const currentCategories = getCurrentCategories();

  // Navigation items
  const navItems = [
    { label: 'Home', icon: <Home className="w-5 h-5" />, path: '/' },
    { label: 'Trending', icon: <TrendingUp className="w-5 h-5" />, path: '/trending' },
    { label: 'New Arrivals', icon: <Sparkles className="w-5 h-5" />, path: '/new-arrivals' },
    { label: 'Best Sellers', icon: <Award className="w-5 h-5" />, path: '/best-sellers' },
    { label: 'Special Offers', icon: <Percent className="w-5 h-5" />, path: '/offers' },
    { label: 'Gift Ideas', icon: <Gift className="w-5 h-5" />, path: '/gifts' },
  ];

  // Quick links
  const quickLinks = [
    { label: 'Track Order', icon: <Package className="w-5 h-5" />, path: '/track-order' },
    { label: 'Help Center', icon: <HelpCircle className="w-5 h-5" />, path: '/help' },
    { label: 'Contact Us', icon: <Headphones className="w-5 h-5" />, path: '/contact' },
  ];

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            ref={sidebarRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="relative w-full max-w-sm bg-white shadow-2xl overflow-hidden flex flex-col"
            onClick={handleSidebarClick}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-xl">UniMarket</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:rotate-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Info */}
              {user ? (
                <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-white/80 truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      navigate('/login');
                    }}
                    className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      navigate('/register');
                    }}
                    className="flex-1 py-2 px-3 bg-white hover:text-teal-600 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Join Free
                  </button>
                </div>
              )}
            </div>

            {/* Search - only show on main level */}
            {categoryStack.length === 0 && (
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Search categories..."
                    className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {categoryStack.length > 0 && activeCategory ? (
                // Subcategories View
                <div className="p-4">
                  {/* Back Button */}
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-4 group"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to {categoryStack.length > 1 ? categoryStack[categoryStack.length - 2]?.name : 'Categories'}</span>
                  </button>

                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradient(categories.findIndex(c => c._id === activeCategory._id))} flex items-center justify-center text-white`}>
                        {getCategoryIcon(activeCategory)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{activeCategory.name}</h3>
                        <p className="text-sm text-gray-600">{activeCategory.stats?.productCount || 0} products</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCategoryClick(activeCategory)}
                      className="w-full py-2 bg-white text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-50 transition-colors"
                    >
                      View All {activeCategory.name}
                    </button>
                  </div>

                  {/* Subcategories */}
                  <div className="space-y-3">
                    {activeCategory.children?.map((subcat, idx) => (
                      <div key={subcat._id} className="bg-white border border-gray-100 rounded-xl p-3 hover:border-teal-200 transition-colors">
                        <button
                          onClick={() => subcat.children?.length > 0 ? handleCategoryNav(subcat) : handleCategoryClick(subcat)}
                          className="w-full flex items-center justify-between mb-2 group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                              {getCategoryIcon(subcat)}
                            </div>
                            <span className="font-medium text-gray-900">{subcat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {subcat.stats?.productCount > 0 && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {subcat.stats.productCount}
                              </span>
                            )}
                            {subcat.children?.length > 0 && (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>
                        
                        {/* Show preview of next level if available */}
                        {subcat.children?.length > 0 && (
                          <div className="pl-10 mt-2 space-y-2 border-l-2 border-teal-100">
                            {subcat.children.slice(0, 3).map((thirdLevel) => (
                              <button
                                key={thirdLevel._id}
                                onClick={() => handleCategoryClick(thirdLevel)}
                                className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors group"
                              >
                                <span>{thirdLevel.name}</span>
                                {thirdLevel.stats?.productCount > 0 && (
                                  <span className="text-xs text-gray-400 group-hover:text-teal-600">
                                    {thirdLevel.stats.productCount}
                                  </span>
                                )}
                              </button>
                            ))}
                            {subcat.children.length > 3 && (
                              <button
                                onClick={() => handleCategoryNav(subcat)}
                                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                              >
                                +{subcat.children.length - 3} more
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Main Menu
                <div className="p-4">
                  {/* Navigation Items */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                      Navigation
                    </h3>
                    <div className="space-y-1">
                      {navItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            navigate(item.path);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-teal-50 rounded-lg transition-all duration-200 group"
                        >
                          <span className="text-gray-400 group-hover:text-teal-600 group-hover:scale-110 transition-all">
                            {item.icon}
                          </span>
                          <span className="text-sm font-medium group-hover:text-teal-700">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categories Section */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                      Shop by Category
                    </h3>
                    {isLoading ? (
                      <div className="space-y-2">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(searchTerm ? filteredCategories : categories).slice(0, 8).map((category, index) => (
                          <button
                            key={category._id}
                            onClick={() => handleCategoryNav(category)}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-gray-700 hover:bg-teal-50 rounded-lg transition-all duration-200 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getGradient(index)} flex items-center justify-center text-white`}>
                                {getCategoryIcon(category)}
                              </div>
                              <span className="text-sm font-medium group-hover:text-teal-700">{category.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {category.stats?.productCount > 0 && (
                                <span className="text-xs text-gray-500">
                                  {category.stats.productCount}
                                </span>
                              )}
                              {category.children?.length > 0 && (
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                              )}
                            </div>
                          </button>
                        ))}
                        {categories.length > 8 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              navigate('/categories');
                            }}
                            className="w-full text-center text-sm text-teal-600 hover:text-teal-700 py-2"
                          >
                            View All {categories.length} Categories
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Links */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                      Quick Links
                    </h3>
                    <div className="space-y-1">
                      {quickLinks.map((link, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            navigate(link.path);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-teal-50 rounded-lg transition-all duration-200 group"
                        >
                          <span className="text-gray-400 group-hover:text-teal-600">{link.icon}</span>
                          <span className="text-sm font-medium group-hover:text-teal-700">{link.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {user && (
              <div className="border-t border-gray-200 p-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 hover:from-red-100 hover:to-rose-100 rounded-lg font-medium transition-all duration-200 group"
                >
                  <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Sign Out
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;