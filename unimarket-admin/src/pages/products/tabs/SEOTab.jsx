// components/admin/products/tabs/SEOTab.jsx
import React, { useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import { 
  FiSearch, 
  FiEye, 
  FiTwitter, 
  FiFacebook, 
  FiLinkedin,
  FiLink,
  FiCode,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiHash,
  FiGlobe,
  FiImage,
  FiType,
  FiFileText,
  FiEdit3,
  FiExternalLink,
  FiCpu,
  FiBarChart2,
  FiShare2,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiXCircle
} from 'react-icons/fi';

// Create a data URL for a fallback image (avoids external dependencies)
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'1200\' height=\'630\' viewBox=\'0 0 1200 630\'%3E%3Crect width=\'1200\' height=\'630\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'600\' y=\'315\' font-family=\'Arial\' font-size=\'24\' fill=\'%239ca3af\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';

const SEOTab = ({ formData, onInputChange, errors }) => {
  const [activeSocialTab, setActiveSocialTab] = useState('facebook');
  const [showStructuredData, setShowStructuredData] = useState(false);
  const [seoScore, setSeoScore] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const handleKeywordChange = (newKeywords) => {
    onInputChange('seo', {
      ...(formData.seo || {}),
      keywords: newKeywords.map(k => k.value)
    });
    calculateSeoScore();
  };

  const generateSEOTitle = () => {
    if (formData.name) {
      const title = `${formData.name} | Buy Online at Best Price in Kenya`;
      onInputChange('seo', {
        ...(formData.seo || {}),
        title
      });
      calculateSeoScore();
    }
  };

  const generateSEODescription = () => {
    if (formData.description) {
      const description = formData.description.substring(0, 155) + (formData.description.length > 155 ? '...' : '');
      onInputChange('seo', {
        ...(formData.seo || {}),
        description
      });
      calculateSeoScore();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleImageError = (key) => {
    // Prevent infinite loop by only setting error once
    if (!imageErrors[key]) {
      setImageErrors(prev => ({ ...prev, [key]: true }));
    }
  };

  const calculateSeoScore = () => {
    let score = 0;
    let maxScore = 100;
    let details = [];

    const seo = formData.seo || {};

    // Title check
    if (seo.title) {
      const titleLength = seo.title.length;
      if (titleLength >= 50 && titleLength <= 60) {
        score += 25;
        details.push({ pass: true, message: 'Title length is perfect (50-60 chars)' });
      } else if (titleLength > 0) {
        score += 15;
        details.push({ pass: false, message: `Title should be 50-60 characters (currently ${titleLength})` });
      }
    } else {
      details.push({ pass: false, message: 'SEO title is missing' });
    }

    // Description check
    if (seo.description) {
      const descLength = seo.description.length;
      if (descLength >= 150 && descLength <= 160) {
        score += 25;
        details.push({ pass: true, message: 'Description length is perfect (150-160 chars)' });
      } else if (descLength > 0) {
        score += 15;
        details.push({ pass: false, message: `Description should be 150-160 characters (currently ${descLength})` });
      }
    } else {
      details.push({ pass: false, message: 'Meta description is missing' });
    }

    // Keywords check
    if (seo.keywords?.length > 0) {
      score += 15;
      details.push({ pass: true, message: `${seo.keywords.length} keywords added` });
    } else {
      details.push({ pass: false, message: 'No focus keywords added' });
    }

    // Slug check
    if (formData.slug) {
      score += 10;
      details.push({ pass: true, message: 'URL slug is set' });
    } else {
      details.push({ pass: false, message: 'URL slug is missing' });
    }

    // Open Graph check
    if (seo.ogTitle || seo.ogDescription || seo.ogImage) {
      score += 10;
      details.push({ pass: true, message: 'Open Graph data partially filled' });
    } else {
      details.push({ pass: false, message: 'No Open Graph data' });
    }

    // Twitter Card check
    if (seo.twitterCard) {
      score += 5;
      details.push({ pass: true, message: 'Twitter Card configured' });
    } else {
      details.push({ pass: false, message: 'Twitter Card not configured' });
    }

    // Robots check (default is good)
    if (seo.robots && !seo.robots.includes('noindex')) {
      score += 10;
      details.push({ pass: true, message: 'Product is indexable' });
    } else if (seo.robots) {
      details.push({ pass: false, message: 'Product is set to noindex' });
    }

    setSeoScore({ score, maxScore, details });
    return { score, maxScore, details };
  };

  const previewInGoogle = () => {
    const seo = formData.seo || {};
    const title = seo.title || formData.name || 'Product Title';
    const description = seo.description || formData.shortDescription || 'Product description will appear here...';
    const url = `https://yourstore.com/product/${formData.slug || 'product-url'}`;
    
    return { title, description, url };
  };

  const previewInFacebook = () => {
    const seo = formData.seo || {};
    const title = seo.ogTitle || seo.title || formData.name || 'Product Title';
    const description = seo.ogDescription || seo.description || formData.shortDescription || 'Product description';
    const image = seo.ogImage || (formData.images?.[0]?.url);
    
    return { title, description, image };
  };

  const previewInTwitter = () => {
    const seo = formData.seo || {};
    const title = seo.twitterTitle || seo.ogTitle || seo.title || formData.name || 'Product Title';
    const description = seo.twitterDescription || seo.ogDescription || seo.description || formData.shortDescription || 'Product description';
    const image = seo.twitterImage || seo.ogImage || (formData.images?.[0]?.url);
    const card = seo.twitterCard || 'summary_large_image';
    
    return { title, description, image, card };
  };

  const googlePreview = previewInGoogle();
  const facebookPreview = previewInFacebook();
  const twitterPreview = previewInTwitter();

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 mr-4">
            <FiSearch className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">SEO & Metadata</h3>
            <p className="text-sm text-gray-600">
              Optimize your product for search engines and social media platforms to improve visibility and click-through rates.
            </p>
          </div>
        </div>
      </div>

      {/* SEO Score Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FiBarChart2 className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">SEO Score</h4>
          </div>
          <button
            onClick={calculateSeoScore}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Refresh score"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>

        {seoScore ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overall SEO Health</span>
              <span className={`text-2xl font-bold ${getScoreColor(seoScore.score)}`}>
                {seoScore.score}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  seoScore.score >= 80 ? 'bg-green-500' :
                  seoScore.score >= 60 ? 'bg-yellow-500' :
                  seoScore.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${seoScore.score}%` }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {seoScore.details.map((detail, index) => (
                <div key={index} className="flex items-center text-sm">
                  {detail.pass ? (
                    <FiCheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  ) : (
                    <FiAlertCircle className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                  )}
                  <span className="text-gray-600">{detail.message}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={calculateSeoScore}
            className="w-full py-4 text-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border-2 border-dashed border-gray-200"
          >
            <FiCpu className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm">Analyze SEO</span>
          </button>
        )}
      </div>

      {/* Google Preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center">
            <FiEye className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Google Search Preview</h4>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-2xl">
            <div className="text-blue-600 text-lg font-medium hover:underline cursor-pointer">
              {googlePreview.title}
            </div>
            <div className="text-green-600 text-sm break-all">
              {googlePreview.url}
            </div>
            <div className="text-gray-600 text-sm mt-1">
              {googlePreview.description}
            </div>
          </div>
        </div>
      </div>

      {/* Basic SEO Fields - Schema aligned */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center">
            <FiEdit3 className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Basic SEO</h4>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* SEO Title */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700">
                SEO Title
              </label>
              <button
                type="button"
                onClick={generateSEOTitle}
                className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded"
              >
                <FiRefreshCw className="w-3 h-3 mr-1" />
                Generate
              </button>
            </div>
            <div className="relative">
              <FiType className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                id="seoTitle"
                value={formData.seo?.title || ''}
                onChange={(e) => {
                  onInputChange('seo', {
                    ...(formData.seo || {}),
                    title: e.target.value
                  });
                  calculateSeoScore();
                }}
                className={`block w-full pl-10 pr-3 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200 ${
                  errors?.seo?.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter SEO title"
                maxLength={70}
              />
            </div>
            {errors?.seo?.title && (
              <p className="mt-1 text-xs text-red-600">{errors.seo.title}</p>
            )}
            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs text-gray-500 flex items-center">
                <FiInfo className="w-3 h-3 mr-1" />
                Recommended: 50-60 characters
              </span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${
                  (formData.seo?.title?.length || 0) > 70 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {formData.seo?.title?.length || 0}/70
                </span>
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      (formData.seo?.title?.length || 0) > 70 ? 'bg-red-500' :
                      (formData.seo?.title?.length || 0) >= 50 ? 'bg-green-500' :
                      (formData.seo?.title?.length || 0) > 0 ? 'bg-yellow-500' : 'bg-gray-200'
                    }`}
                    style={{ width: `${Math.min(((formData.seo?.title?.length || 0) / 70) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700">
                Meta Description
              </label>
              <button
                type="button"
                onClick={generateSEODescription}
                className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded"
              >
                <FiRefreshCw className="w-3 h-3 mr-1" />
                Generate
              </button>
            </div>
            <div className="relative">
              <FiFileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                id="seoDescription"
                rows={3}
                value={formData.seo?.description || ''}
                onChange={(e) => {
                  onInputChange('seo', {
                    ...(formData.seo || {}),
                    description: e.target.value
                  });
                  calculateSeoScore();
                }}
                className={`block w-full pl-10 pr-3 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200 ${
                  errors?.seo?.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter meta description"
                maxLength={320}
              />
            </div>
            {errors?.seo?.description && (
              <p className="mt-1 text-xs text-red-600">{errors.seo.description}</p>
            )}
            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs text-gray-500 flex items-center">
                <FiInfo className="w-3 h-3 mr-1" />
                Recommended: 150-160 characters
              </span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${
                  (formData.seo?.description?.length || 0) > 320 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {formData.seo?.description?.length || 0}/320
                </span>
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      (formData.seo?.description?.length || 0) > 320 ? 'bg-red-500' :
                      (formData.seo?.description?.length || 0) >= 150 ? 'bg-green-500' :
                      (formData.seo?.description?.length || 0) > 0 ? 'bg-yellow-500' : 'bg-gray-200'
                    }`}
                    style={{ width: `${Math.min(((formData.seo?.description?.length || 0) / 320) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Focus Keywords */}
          <div>
            <label htmlFor="seoKeywords" className="block text-sm font-medium text-gray-700 mb-1">
              Focus Keywords
            </label>
            <div className="relative">
              <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <CreatableSelect
                id="seoKeywords"
                isMulti
                value={(formData.seo?.keywords || []).map(k => ({ value: k, label: k }))}
                onChange={handleKeywordChange}
                className="react-select"
                classNamePrefix="select"
                placeholder="Enter keywords and press enter..."
                formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '0.75rem',
                    padding: '2px 2px 2px 30px',
                    borderColor: '#e5e7eb',
                    '&:hover': { borderColor: '#6366f1' }
                  })
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <FiTrendingUp className="w-3 h-3 mr-1" />
              Enter keywords you want this product to rank for
            </p>
          </div>

          {/* Canonical URL - Schema field */}
          <div>
            <label htmlFor="canonical" className="block text-sm font-medium text-gray-700 mb-1">
              Canonical URL
            </label>
            <div className="relative">
              <FiExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                id="canonical"
                value={formData.seo?.canonical || ''}
                onChange={(e) => onInputChange('seo', {
                  ...(formData.seo || {}),
                  canonical: e.target.value
                })}
                className="block w-full pl-10 pr-3 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200"
                placeholder="https://yourstore.com/product/canonical-url"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <FiInfo className="w-3 h-3 mr-1" />
              Use if this product is syndicated from another source
            </p>
          </div>

          {/* Robots Meta - Schema field */}
          <div>
            <label htmlFor="robots" className="block text-sm font-medium text-gray-700 mb-1">
              Robots Meta
            </label>
            <div className="relative">
              <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                id="robots"
                value={formData.seo?.robots || 'index, follow'}
                onChange={(e) => onInputChange('seo', {
                  ...(formData.seo || {}),
                  robots: e.target.value
                })}
                className="block w-full pl-10 pr-3 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-all duration-200 appearance-none bg-white"
              >
                <option value="index, follow">Index, Follow</option>
                <option value="noindex, follow">No Index, Follow</option>
                <option value="index, nofollow">Index, No Follow</option>
                <option value="noindex, nofollow">No Index, No Follow</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Preview Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center">
            <FiShare2 className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Social Media Preview</h4>
          </div>
        </div>

        {/* Social Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6" aria-label="Social Platforms">
            <button
              onClick={() => setActiveSocialTab('facebook')}
              className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center ${
                activeSocialTab === 'facebook'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiFacebook className="w-4 h-4 mr-2" />
              Facebook
            </button>
            <button
              onClick={() => setActiveSocialTab('twitter')}
              className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center ${
                activeSocialTab === 'twitter'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiTwitter className="w-4 h-4 mr-2" />
              Twitter
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Facebook Preview */}
          {activeSocialTab === 'facebook' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-md">
                <img 
                  src={imageErrors.facebook ? FALLBACK_IMAGE : (facebookPreview.image || FALLBACK_IMAGE)}
                  alt="OG Preview"
                  className="w-full h-64 object-cover bg-gray-100"
                  onError={() => handleImageError('facebook')}
                />
                <div className="p-4">
                  <div className="text-xs text-gray-500 uppercase">yourstore.com</div>
                  <div className="text-base font-semibold text-gray-900 mt-1">
                    {facebookPreview.title}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {facebookPreview.description}
                  </div>
                </div>
              </div>

              {/* Open Graph Fields - Schema fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ogTitle" className="block text-xs font-medium text-gray-600 mb-1">
                    OG Title
                  </label>
                  <input
                    type="text"
                    id="ogTitle"
                    value={formData.seo?.ogTitle || ''}
                    onChange={(e) => onInputChange('seo', {
                      ...(formData.seo || {}),
                      ogTitle: e.target.value
                    })}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Leave empty to use SEO title"
                    maxLength={70}
                  />
                </div>

                <div>
                  <label htmlFor="ogType" className="block text-xs font-medium text-gray-600 mb-1">
                    OG Type
                  </label>
                  <select
                    id="ogType"
                    value={formData.seo?.ogType || 'product'}
                    onChange={(e) => onInputChange('seo', {
                      ...(formData.seo || {}),
                      ogType: e.target.value
                    })}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="product">Product</option>
                    <option value="website">Website</option>
                    <option value="article">Article</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="ogDescription" className="block text-xs font-medium text-gray-600 mb-1">
                    OG Description
                  </label>
                  <textarea
                    id="ogDescription"
                    rows={2}
                    value={formData.seo?.ogDescription || ''}
                    onChange={(e) => onInputChange('seo', {
                      ...(formData.seo || {}),
                      ogDescription: e.target.value
                    })}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Leave empty to use meta description"
                    maxLength={200}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="ogImage" className="block text-xs font-medium text-gray-600 mb-1">
                    OG Image URL
                  </label>
                  <div className="relative">
                    <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      id="ogImage"
                      value={formData.seo?.ogImage || ''}
                      onChange={(e) => {
                        setImageErrors(prev => ({ ...prev, facebook: false }));
                        onInputChange('seo', {
                          ...(formData.seo || {}),
                          ogImage: e.target.value
                        });
                      }}
                      className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://..."
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended size: 1200 x 630 pixels
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Twitter Preview */}
          {activeSocialTab === 'twitter' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-md">
                {twitterPreview.card === 'summary_large_image' ? (
                  <>
                    <img 
                      src={imageErrors.twitter ? FALLBACK_IMAGE : (twitterPreview.image || FALLBACK_IMAGE)}
                      alt="Twitter Preview"
                      className="w-full h-64 object-cover bg-gray-100"
                      onError={() => handleImageError('twitter')}
                    />
                    <div className="p-4">
                      <div className="text-base font-semibold text-gray-900">
                        {twitterPreview.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {twitterPreview.description}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex p-4">
                    <img 
                      src={imageErrors.twitter ? FALLBACK_IMAGE : (twitterPreview.image || FALLBACK_IMAGE)}
                      alt="Twitter Preview"
                      className="w-24 h-24 object-cover rounded-lg bg-gray-100"
                      onError={() => handleImageError('twitter')}
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-base font-semibold text-gray-900">
                        {twitterPreview.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {twitterPreview.description}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Twitter Card Fields - Schema fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twitterCard" className="block text-xs font-medium text-gray-600 mb-1">
                    Card Type
                  </label>
                  <select
                    id="twitterCard"
                    value={formData.seo?.twitterCard || 'summary_large_image'}
                    onChange={(e) => onInputChange('seo', {
                      ...(formData.seo || {}),
                      twitterCard: e.target.value
                    })}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary with Large Image</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="twitterTitle" className="block text-xs font-medium text-gray-600 mb-1">
                    Twitter Title
                  </label>
                  <input
                    type="text"
                    id="twitterTitle"
                    value={formData.seo?.twitterTitle || ''}
                    onChange={(e) => onInputChange('seo', {
                      ...(formData.seo || {}),
                      twitterTitle: e.target.value
                    })}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Leave empty to use OG title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="twitterDescription" className="block text-xs font-medium text-gray-600 mb-1">
                    Twitter Description
                  </label>
                  <textarea
                    id="twitterDescription"
                    rows={2}
                    value={formData.seo?.twitterDescription || ''}
                    onChange={(e) => onInputChange('seo', {
                      ...(formData.seo || {}),
                      twitterDescription: e.target.value
                    })}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Leave empty to use OG description"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="twitterImage" className="block text-xs font-medium text-gray-600 mb-1">
                    Twitter Image URL
                  </label>
                  <div className="relative">
                    <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      id="twitterImage"
                      value={formData.seo?.twitterImage || ''}
                      onChange={(e) => {
                        setImageErrors(prev => ({ ...prev, twitter: false }));
                        onInputChange('seo', {
                          ...(formData.seo || {}),
                          twitterImage: e.target.value
                        });
                      }}
                      className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Leave empty to use OG image"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Structured Data */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <button
          type="button"
          onClick={() => setShowStructuredData(!showStructuredData)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <FiCode className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Structured Data</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
              JSON-LD
            </span>
          </div>
          {showStructuredData ? (
            <FiChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <FiChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showStructuredData && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 my-4">
              JSON-LD structured data helps search engines understand your product better. This will be automatically generated.
            </p>
            
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto relative group">
              <button
                onClick={() => copyToClipboard(JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Product",
                  "name": formData.name || 'Product Name',
                  "description": (formData.seo?.description || formData.shortDescription || '').replace(/"/g, '\\"'),
                  "sku": formData.sku || '',
                  "mpn": formData.mpn || '',
                  "brand": formData.brandName ? {
                    "@type": "Brand",
                    "name": formData.brandName
                  } : undefined,
                  "image": (formData.images || []).map(img => img.url),
                  "offers": {
                    "@type": "Offer",
                    "price": formData.price || 0,
                    "priceCurrency": formData.currency || 'USD',
                    "availability": formData.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "url": `https://yourstore.com/product/${formData.slug || 'product-url'}`
                  },
                  ...(formData.reviews?.averageRating ? {
                    "aggregateRating": {
                      "@type": "AggregateRating",
                      "ratingValue": formData.reviews.averageRating,
                      "reviewCount": formData.reviews.totalReviews || 0
                    }
                  } : {})
                }, null, 2))}
                className="absolute top-2 right-2 p-2 bg-gray-800 text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-700"
                title="Copy to clipboard"
              >
                <FiCopy className="w-4 h-4" />
              </button>
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
{`{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${formData.name || 'Product Name'}",
  "description": "${(formData.seo?.description || formData.shortDescription || '').replace(/"/g, '\\"')}",
  "sku": "${formData.sku || ''}",
  "mpn": "${formData.mpn || ''}"${formData.brandName ? `,
  "brand": {
    "@type": "Brand",
    "name": "${formData.brandName}"
  }` : ''},
  "image": ${JSON.stringify((formData.images || []).map(img => img.url))},
  "offers": {
    "@type": "Offer",
    "price": "${formData.price || 0}",
    "priceCurrency": "${formData.currency || 'USD'}",
    "availability": "${formData.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}",
    "url": "https://yourstore.com/product/${formData.slug || 'product-url'}"
  }${formData.reviews?.averageRating ? `,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "${formData.reviews.averageRating}",
    "reviewCount": "${formData.reviews.totalReviews || 0}"
  }` : ''}
}`}
              </pre>
            </div>
            
            <div className="mt-4 flex items-center">
              <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-xs text-gray-600">
                Structured data will be automatically added to your product page
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SEO Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FiCheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">SEO Summary</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{formData.seo?.title?.length || 0}</div>
            <div className="text-xs text-gray-500">Title Length</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{formData.seo?.description?.length || 0}</div>
            <div className="text-xs text-gray-500">Description Length</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{formData.seo?.keywords?.length || 0}</div>
            <div className="text-xs text-gray-500">Keywords</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {formData.seo?.ogImage ? 1 : 0}
            </div>
            <div className="text-xs text-gray-500">Social Image</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOTab;