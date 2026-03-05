// admin/src/pages/categories/components/CategorySEO.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiSearch, 
  FiTwitter, 
  FiFacebook, 
  FiLink, 
  FiEye,
  FiImage,
  FiEdit2,
  FiRefreshCw,
  FiX,
  FiPlus,
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiHelpCircle,
  FiCopy,
  FiTrendingUp,
  FiBarChart2,
  FiTarget,
  FiGlobe,
  FiSmartphone,
  FiMonitor,
  FiShare2,
  FiCode,
  FiZap,
  FiCpu,
  FiAward
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CategorySEO = ({ formData, onNestedInputChange, errors, showToast }) => {
  const [previewMode, setPreviewMode] = useState('google');
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [seoScore, setSeoScore] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [copied, setCopied] = useState(false);

  // Calculate SEO score based on filled fields
  useEffect(() => {
    let score = 0;
    const newSuggestions = [];

    // Meta Title (25 points)
    if (formData.seo?.title) {
      score += 25;
      if (formData.seo.title.length < 30) {
        newSuggestions.push('Meta title is too short (min 30 characters)');
      } else if (formData.seo.title.length > 60) {
        newSuggestions.push('Meta title exceeds recommended 60 characters');
      }
    } else {
      newSuggestions.push('Add a meta title for better SEO');
    }

    // Meta Description (25 points)
    if (formData.seo?.description) {
      score += 25;
      if (formData.seo.description.length < 120) {
        newSuggestions.push('Meta description is too short (min 120 characters)');
      } else if (formData.seo.description.length > 160) {
        newSuggestions.push('Meta description exceeds recommended 160 characters');
      }
    } else {
      newSuggestions.push('Add a meta description for better click-through rates');
    }

    // Keywords (15 points)
    if (formData.seo?.keywords?.length > 0) {
      score += 15;
      if (formData.seo.keywords.length < 3) {
        newSuggestions.push('Add at least 3-5 keywords for better targeting');
      }
    } else {
      newSuggestions.push('Add keywords to improve search relevance');
    }

    // Open Graph (20 points)
    if (formData.seo?.ogTitle) score += 5;
    if (formData.seo?.ogDescription) score += 5;
    if (formData.seo?.ogImage) score += 10;

    // Canonical URL (5 points)
    if (formData.seo?.canonical) score += 5;

    // Robots meta (5 points)
    if (formData.seo?.robots) score += 5;

    setSeoScore(score);
    setSuggestions(newSuggestions);
  }, [formData.seo]);

  const generateMetaTitle = useCallback(() => {
    const baseTitle = formData.name || 'Category';
    const storeName = 'Your Store'; // This could come from settings
    const defaultTitle = `${baseTitle} | ${storeName}`;
    onNestedInputChange('seo', 'title', defaultTitle);
    showToast?.('Meta title generated', { type: 'success' });
  }, [formData.name, onNestedInputChange, showToast]);

  const generateMetaDescription = useCallback(() => {
    const description = formData.description || `Browse our selection of ${formData.name || 'products'}`;
    const defaultDescription = description.length > 155 
      ? description.substring(0, 152) + '...' 
      : description;
    onNestedInputChange('seo', 'description', defaultDescription);
    showToast?.('Meta description generated', { type: 'success' });
  }, [formData.description, formData.name, onNestedInputChange, showToast]);

  const generateKeywords = useCallback(() => {
    if (formData.name || formData.description) {
      const words = new Set();
      
      // Extract words from name
      if (formData.name) {
        formData.name.toLowerCase().split(/\s+/).forEach(word => {
          if (word.length > 2) words.add(word);
        });
      }
      
      // Extract words from description
      if (formData.description) {
        formData.description.toLowerCase().split(/\s+/).forEach(word => {
          if (word.length > 3) words.add(word);
        });
      }
      
      const newKeywords = Array.from(words).slice(0, 10);
      onNestedInputChange('seo', 'keywords', newKeywords);
      showToast?.('Keywords generated from content', { type: 'success' });
    }
  }, [formData.name, formData.description, onNestedInputChange, showToast]);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast?.('Copied to clipboard', { type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    });
  }, [showToast]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const tabs = [
    { id: 'basic', label: 'Basic SEO', icon: FiSearch },
    { id: 'social', label: 'Social Media', icon: FiShare2 },
    { id: 'advanced', label: 'Advanced', icon: FiCode }
  ];

  return (
    <div className="space-y-6">
      {/* Header with SEO Score */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <FiTarget className="w-6 h-6 mr-2" />
              SEO Optimization
            </h2>
            <p className="text-indigo-100 mt-1">
              Optimize your category for search engines and social media
            </p>
          </div>
          <div className="text-right">
            <div className={`w-20 h-20 rounded-full ${getScoreBg(seoScore)} flex items-center justify-center shadow-lg`}>
              <span className={`text-2xl font-bold ${getScoreColor(seoScore)}`}>
                {seoScore}
              </span>
            </div>
            <p className="text-indigo-100 text-xs mt-1">SEO Score</p>
          </div>
        </div>

        {/* SEO Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-white/20 backdrop-blur-lg rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center">
              <FiAlertCircle className="w-4 h-4 mr-2" />
              Optimization Suggestions
            </h3>
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-sm text-indigo-100 flex items-center"
                >
                  <FiInfo className="w-3 h-3 mr-2 flex-shrink-0" />
                  {suggestion}
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-3 border-b-2 font-medium text-sm flex items-center space-x-2
                  transition-all relative
                  ${isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeSEOTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Preview Toggle & Platform Selector */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Preview:</span>
          <div className="flex items-center space-x-2">
            {['google', 'twitter', 'facebook'].map(platform => (
              <button
                key={platform}
                onClick={() => setPreviewMode(platform)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2
                  ${previewMode === platform
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {platform === 'google' && <FiMonitor className="w-4 h-4" />}
                {platform === 'twitter' && <FiTwitter className="w-4 h-4" />}
                {platform === 'facebook' && <FiFacebook className="w-4 h-4" />}
                <span className="capitalize">{platform}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <FiEye className="w-4 h-4" />
          <span className="text-sm">{showPreview ? 'Hide' : 'Show'} Preview</span>
        </button>
      </div>

      {/* Live Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 shadow-lg"
          >
            <h4 className="text-sm font-medium text-gray-700 mb-4">Live Preview</h4>
            {previewMode === 'google' && <GooglePreview formData={formData} />}
            {previewMode === 'twitter' && <TwitterPreview formData={formData} />}
            {previewMode === 'facebook' && <FacebookPreview formData={formData} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Basic SEO Tab */}
      {activeTab === 'basic' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Meta Title */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Meta Title <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={generateMetaTitle}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center bg-indigo-50 px-3 py-1 rounded-lg"
                >
                  <FiRefreshCw className="w-3 h-3 mr-1" />
                  Generate
                </button>
                {formData.seo?.title && (
                  <button
                    onClick={() => copyToClipboard(formData.seo.title)}
                    className="text-xs text-gray-600 hover:text-gray-700 flex items-center bg-gray-100 px-3 py-1 rounded-lg"
                  >
                    <FiCopy className="w-3 h-3 mr-1" />
                    Copy
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formData.seo?.title || ''}
                onChange={(e) => onNestedInputChange('seo', 'title', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-24 ${
                  errors?.title ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="Enter meta title (max 70 characters)"
                maxLength="70"
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-full ${
                (formData.seo?.title?.length || 0) > 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {formData.seo?.title?.length || 0}/70
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500 flex items-center">
                <FiInfo className="w-3 h-3 mr-1" />
                Recommended: 50-60 characters
              </p>
              <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all"
                  style={{ width: `${Math.min(((formData.seo?.title?.length || 0) / 60) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Meta Description */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Meta Description <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={generateMetaDescription}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center bg-indigo-50 px-3 py-1 rounded-lg"
                >
                  <FiRefreshCw className="w-3 h-3 mr-1" />
                  Generate
                </button>
                {formData.seo?.description && (
                  <button
                    onClick={() => copyToClipboard(formData.seo.description)}
                    className="text-xs text-gray-600 hover:text-gray-700 flex items-center bg-gray-100 px-3 py-1 rounded-lg"
                  >
                    <FiCopy className="w-3 h-3 mr-1" />
                    Copy
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <textarea
                value={formData.seo?.description || ''}
                onChange={(e) => onNestedInputChange('seo', 'description', e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                  errors?.description ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="Enter meta description (max 320 characters)"
                maxLength="320"
              />
              <span className={`absolute right-3 bottom-3 text-xs px-2 py-1 rounded-full ${
                (formData.seo?.description?.length || 0) > 160 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {formData.seo?.description?.length || 0}/320
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500 flex items-center">
                <FiInfo className="w-3 h-3 mr-1" />
                Recommended: 150-160 characters
              </p>
              <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all"
                  style={{ width: `${Math.min(((formData.seo?.description?.length || 0) / 160) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Keywords
              </label>
              <button
                onClick={generateKeywords}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center bg-indigo-50 px-3 py-1 rounded-lg"
              >
                <FiZap className="w-3 h-3 mr-1" />
                Auto-generate
              </button>
            </div>
            <KeywordInput
              keywords={formData.seo?.keywords || []}
              onChange={(keywords) => onNestedInputChange('seo', 'keywords', keywords)}
              showToast={showToast}
            />
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <FiInfo className="w-3 h-3 mr-1" />
              Enter keywords separated by commas or press Enter
            </p>
          </div>
        </motion.div>
      )}

      {/* Social Media Tab */}
      {activeTab === 'social' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Open Graph Settings */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FiFacebook className="w-5 h-5 mr-2 text-blue-600" />
              Facebook / Open Graph
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OG Title
                </label>
                <input
                  type="text"
                  value={formData.seo?.ogTitle || ''}
                  onChange={(e) => onNestedInputChange('seo', 'ogTitle', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Override meta title for social sharing"
                  maxLength="70"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.seo?.ogTitle?.length || 0}/70 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OG Description
                </label>
                <textarea
                  value={formData.seo?.ogDescription || ''}
                  onChange={(e) => onNestedInputChange('seo', 'ogDescription', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Override meta description for social sharing"
                  maxLength="200"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.seo?.ogDescription?.length || 0}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OG Image
                </label>
                <div className="flex items-center space-x-4">
                  {formData.seo?.ogImage ? (
                    <div className="relative group">
                      <img
                        src={formData.seo.ogImage}
                        alt="OG Preview"
                        className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        onClick={() => onNestedInputChange('seo', 'ogImage', '')}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                      <FiImage className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <input
                    type="text"
                    value={formData.seo?.ogImage || ''}
                    onChange={(e) => onNestedInputChange('seo', 'ogImage', e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Recommended size: 1200x630 pixels
                </p>
              </div>
            </div>
          </div>

          {/* Twitter Card Settings */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-6 border border-sky-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FiTwitter className="w-5 h-5 mr-2 text-sky-500" />
              Twitter Card
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter Card Type
                </label>
                <select
                  value={formData.seo?.twitterCard || 'summary_large_image'}
                  onChange={(e) => onNestedInputChange('seo', 'twitterCard', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="summary">Summary Card</option>
                  <option value="summary_large_image">Summary Card with Large Image</option>
                  <option value="app">App Card</option>
                  <option value="player">Player Card</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.seo?.twitterCard === 'summary_large_image' 
                    ? 'Large image will be displayed with tweet' 
                    : 'Small square image will be displayed'}
                </p>
              </div>

              {/* Twitter-specific fields */}
              {formData.seo?.twitterCard === 'app' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      iPhone App ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      iPad App ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                      placeholder="123456789"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Play App ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                      placeholder="com.example.app"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Advanced SEO Tab */}
      {activeTab === 'advanced' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Advanced Settings */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FiCode className="w-5 h-5 mr-2 text-indigo-600" />
              Advanced Settings
            </h4>

            <div className="space-y-4">
              {/* Canonical URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canonical URL
                </label>
                <div className="relative">
                  <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.seo?.canonical || ''}
                    onChange={(e) => onNestedInputChange('seo', 'canonical', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="https://yourstore.com/category/example"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to use default category URL
                </p>
              </div>

              {/* Robots Meta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Robots Meta
                </label>
                <select
                  value={formData.seo?.robots || 'index, follow'}
                  onChange={(e) => onNestedInputChange('seo', 'robots', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="index, follow">Index, Follow (Default)</option>
                  <option value="noindex, follow">No Index, Follow</option>
                  <option value="index, nofollow">Index, No Follow</option>
                  <option value="noindex, nofollow">No Index, No Follow</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Controls how search engines crawl and index this page
                </p>
              </div>

              {/* JSON-LD Schema */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSON-LD Schema
                </label>
                <div className="relative">
                  <textarea
                    value={formData.seo?.schema ? JSON.stringify(formData.seo.schema, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const schema = e.target.value ? JSON.parse(e.target.value) : null;
                        onNestedInputChange('seo', 'schema', schema);
                      } catch (error) {
                        // Invalid JSON - show error but don't update
                        if (e.target.value) {
                          showToast?.('Invalid JSON format', { type: 'error' });
                        }
                      }
                    }}
                    rows={8}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder={`{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Category Name"
}`}
                  />
                  {formData.seo?.schema && (
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(formData.seo.schema, null, 2))}
                      className="absolute top-3 right-3 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Add structured data for rich search results
                </p>
              </div>

              {/* Hreflang Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hreflang Tags (Optional)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <select className="px-3 py-2 border-2 border-gray-200 rounded-lg">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                    <input
                      type="text"
                      placeholder="URL for this language"
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg"
                    />
                    <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <FiPlus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Specify alternate language versions of this page
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Enhanced Preview Components
const GooglePreview = ({ formData }) => (
  <motion.div 
    initial={{ scale: 0.95 }}
    animate={{ scale: 1 }}
    className="bg-white rounded-xl border-2 border-gray-200 p-5 max-w-2xl shadow-lg"
  >
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-sm">
        <FiLink className="w-4 h-4 text-green-700" />
        <span className="text-green-700">yourstore.com</span>
        <span className="text-gray-400">›</span>
        <span className="text-gray-600">category</span>
        <span className="text-gray-400">›</span>
        <span className="text-gray-600">{formData.slug || 'category'}</span>
      </div>
      <h3 className="text-xl text-blue-700 font-medium hover:underline cursor-pointer">
        {formData.seo?.title || formData.name || 'Category Title'}
      </h3>
      <p className="text-sm text-gray-600">
        {formData.seo?.description || formData.description || 'Category description will appear here...'}
      </p>
      <div className="flex items-center space-x-4 text-xs text-gray-500">
        <span>⭐ 4.5 (123 reviews)</span>
        <span>🕒 Updated today</span>
      </div>
    </div>
  </motion.div>
);

const TwitterPreview = ({ formData }) => {
  const imageUrl = formData.seo?.ogImage || formData.image;
  
  return (
    <motion.div 
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className="bg-white rounded-xl border-2 border-gray-200 max-w-md overflow-hidden shadow-lg"
    >
      <div className="bg-gradient-to-r from-sky-400 to-blue-500 h-2" />
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            T
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-bold text-gray-900">Twitter</span>
              <span className="text-gray-500 text-sm">@twitter</span>
              <FiTwitter className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-xs text-gray-500">2h ago</p>
          </div>
        </div>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {imageUrl ? (
            <img 
              src={typeof imageUrl === 'string' ? imageUrl : URL.createObjectURL(imageUrl)} 
              alt="Preview"
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FiImage className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="p-3 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">yourstore.com</p>
            <h4 className="font-bold text-gray-900 mb-1">
              {formData.seo?.ogTitle || formData.seo?.title || formData.name || 'Category Title'}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {formData.seo?.ogDescription || formData.seo?.description || formData.description || 'Category description...'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 text-gray-500">
          <span className="text-sm">💬 12</span>
          <span className="text-sm">🔄 34</span>
          <span className="text-sm">❤️ 89</span>
        </div>
      </div>
    </motion.div>
  );
};

const FacebookPreview = ({ formData }) => {
  const imageUrl = formData.seo?.ogImage || formData.image;
  
  return (
    <motion.div 
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className="bg-white rounded-xl border-2 border-gray-200 max-w-md overflow-hidden shadow-lg"
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-2" />
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
            f
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-bold text-gray-900">Your Store</span>
              <FiFacebook className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500">Sponsored · 1h ago</p>
          </div>
        </div>
        <p className="text-sm text-gray-800 mb-3">
          {formData.seo?.ogDescription || formData.seo?.description || formData.description || 'Check out our products!'}
        </p>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {imageUrl ? (
            <img 
              src={typeof imageUrl === 'string' ? imageUrl : URL.createObjectURL(imageUrl)} 
              alt="Preview"
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FiImage className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="p-3 bg-gray-50">
            <p className="text-xs text-gray-500 uppercase">yourstore.com</p>
            <h4 className="font-bold text-gray-900 text-lg">
              {formData.seo?.ogTitle || formData.seo?.title || formData.name || 'Category Title'}
            </h4>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 text-gray-500 border-t border-gray-200 pt-3">
          <span className="text-sm">👍 234</span>
          <span className="text-sm">💬 45</span>
          <span className="text-sm">🔄 12</span>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Keyword Input Component
const KeywordInput = ({ keywords, onChange, showToast }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestedKeywords, setSuggestedKeywords] = useState([]);

  // Mock keyword suggestions (in real app, these would come from an API)
  useEffect(() => {
    if (inputValue.length > 2) {
      // Simulate API call for suggestions
      const mockSuggestions = [
        `${inputValue} products`,
        `best ${inputValue}`,
        `buy ${inputValue} online`,
        `${inputValue} deals`,
        `cheap ${inputValue}`
      ];
      setSuggestedKeywords(mockSuggestions);
    } else {
      setSuggestedKeywords([]);
    }
  }, [inputValue]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword();
    }
  };

  const addKeyword = (value = inputValue) => {
    const keyword = value.trim().toLowerCase();
    if (keyword && !keywords.includes(keyword) && keywords.length < 20) {
      onChange([...keywords, keyword]);
      setInputValue('');
      showToast?.(`Keyword "${keyword}" added`, { type: 'success' });
    } else if (keywords.length >= 20) {
      showToast?.('Maximum 20 keywords allowed', { type: 'warning' });
    }
  };

  const removeKeyword = (keywordToRemove) => {
    onChange(keywords.filter(k => k !== keywordToRemove));
    showToast?.(`Keyword "${keywordToRemove}" removed`, { type: 'info' });
  };

  const clearAllKeywords = () => {
    if (keywords.length > 0) {
      onChange([]);
      showToast?.('All keywords cleared', { type: 'info' });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        <AnimatePresence>
          {keywords.map(keyword => (
            <motion.span
              key={keyword}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm shadow-md"
            >
              {keyword}
              <button
                onClick={() => removeKeyword(keyword)}
                className="ml-2 text-white/80 hover:text-white transition-colors"
              >
                <FiX className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addKeyword()}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          placeholder="Add keyword and press Enter..."
          disabled={keywords.length >= 20}
        />
        {inputValue && (
          <button
            onClick={() => setInputValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Keyword Suggestions */}
      <AnimatePresence>
        {suggestedKeywords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-50 rounded-lg p-3"
          >
            <p className="text-xs text-gray-500 mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedKeywords.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => addKeyword(suggestion)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  + {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keywords Stats */}
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded-full ${
          keywords.length >= 20 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {keywords.length}/20 keywords
        </span>
        {keywords.length > 0 && (
          <button
            onClick={clearAllKeywords}
            className="text-red-600 hover:text-red-700 flex items-center"
          >
            <FiX className="w-3 h-3 mr-1" />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default CategorySEO;