import React, { useState } from 'react'
import { 
  Eye,
  Edit,
  Save,
  Upload,
  Palette,
  Layout,
  Image,
  ShoppingBag,
  Globe,
  Smartphone,
  Monitor,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Move
} from 'lucide-react'

const Storefront = () => {
  const [activeTab, setActiveTab] = useState('home')
  const [isLivePreview, setIsLivePreview] = useState(false)
  const [theme, setTheme] = useState('light')

  const tabs = [
    { id: 'home', label: 'Home Page' },
    { id: 'pages', label: 'Pages' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'theme', label: 'Theme' },
    { id: 'seo', label: 'SEO' },
  ]

  const pages = [
    { id: 1, title: 'Home', slug: '/', status: 'published', views: '12.5k' },
    { id: 2, title: 'Shop', slug: '/shop', status: 'published', views: '8.2k' },
    { id: 3, title: 'About Us', slug: '/about', status: 'published', views: '3.4k' },
    { id: 4, title: 'Contact', slug: '/contact', status: 'published', views: '2.1k' },
    { id: 5, title: 'Blog', slug: '/blog', status: 'draft', views: '5.7k' },
    { id: 6, title: 'FAQ', slug: '/faq', status: 'published', views: '1.8k' },
  ]

  const navigationItems = [
    { id: 1, label: 'Home', url: '/', position: 1, enabled: true },
    { id: 2, label: 'Shop', url: '/shop', position: 2, enabled: true },
    { id: 3, label: 'Categories', url: '/categories', position: 3, enabled: true },
    { id: 4, label: 'Sale', url: '/sale', position: 4, enabled: true },
    { id: 5, label: 'About', url: '/about', position: 5, enabled: true },
    { id: 6, label: 'Contact', url: '/contact', position: 6, enabled: true },
  ]

  const themeColors = [
    { name: 'Primary', value: '#3b82f6', variable: 'primary' },
    { name: 'Secondary', value: '#64748b', variable: 'secondary' },
    { name: 'Accent', value: '#8b5cf6', variable: 'accent' },
    { name: 'Background', value: '#ffffff', variable: 'background' },
    { name: 'Text', value: '#1f2937', variable: 'text' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Storefront</h1>
            <p className="text-gray-600">Customize your online store appearance</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsLivePreview(!isLivePreview)}
              className="btn-secondary flex items-center"
            >
              {isLivePreview ? (
                <>
                  <XCircle className="h-5 w-5 mr-2" />
                  Exit Preview
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 mr-2" />
                  Live Preview
                </>
              )}
            </button>
            
            <button className="btn-primary flex items-center">
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Preview Banner */}
      {isLivePreview && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-700 font-medium">Live Preview Mode</span>
              <span className="ml-2 text-blue-600">Changes are visible in real-time</span>
            </div>
            <button 
              onClick={() => setIsLivePreview(false)}
              className="text-blue-700 hover:text-blue-800"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Hero Section</h3>
                <p className="text-gray-600">Main banner on your homepage</p>
              </div>
              <button className="btn-secondary flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-primary-500 to-blue-600 rounded-lg p-8 text-white">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold mb-4">Welcome to Unimarket</h2>
                <p className="text-lg mb-6 opacity-90">Discover amazing products at unbeatable prices. Shop now and get free shipping on orders over $50.</p>
                <button className="bg-white text-primary-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100">
                  Shop Now
                </button>
              </div>
            </div>
          </div>

          {/* Featured Products */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Featured Products</h3>
                <p className="text-gray-600">Highlighted products section</p>
              </div>
              <button className="btn-secondary flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Products
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Featured Product {i}</h4>
                  <p className="text-sm text-gray-600 mb-3">Product description goes here</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">$99.99</span>
                    <button className="text-primary-600 hover:text-primary-700">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Layout Options */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Layout Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 cursor-pointer">
                <div className="flex items-center mb-3">
                  <Layout className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium">Grid Layout</span>
                </div>
                <div className="h-32 bg-gray-100 rounded grid grid-cols-2 gap-2 p-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
              
              <div className="border-2 border-primary-500 rounded-lg p-4 bg-primary-50">
                <div className="flex items-center mb-3">
                  <Layout className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="font-medium">List Layout</span>
                  <span className="ml-auto text-xs bg-primary-600 text-white px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="h-32 bg-gray-100 rounded space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
              
              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 cursor-pointer">
                <div className="flex items-center mb-3">
                  <Layout className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium">Carousel Layout</span>
                </div>
                <div className="h-32 bg-gray-100 rounded p-2">
                  <div className="h-full bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Website Pages</h3>
                <p className="text-gray-600">Manage your store pages</p>
              </div>
              <button className="btn-primary flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Create Page
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header">Page Title</th>
                    <th className="table-header">URL Slug</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Views</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pages.map((page) => (
                    <tr key={page.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{page.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{page.slug}</code>
                      </td>
                      <td className="px-6 py-4">
                        {page.status === 'published' ? (
                          <span className="badge badge-success">Published</span>
                        ) : (
                          <span className="badge badge-warning">Draft</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{page.views}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-1.5 text-gray-400 hover:text-primary-600">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-blue-600">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'navigation' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Navigation Menu</h3>
            
            <div className="space-y-4">
              {navigationItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <Move className="h-5 w-5 text-gray-400 mr-3 cursor-move" />
                    <div>
                      <div className="font-medium text-gray-900">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.url}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Position:</span>
                      <input
                        type="number"
                        value={item.position}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        min="1"
                      />
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                    
                    <button className="p-1.5 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center">
                <Plus className="h-5 w-5 mr-2" />
                Add Navigation Item
              </button>
            </div>
          </div>
          
          {/* Preview */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Preview</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-6">
                {navigationItems.filter(item => item.enabled).map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'theme' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Theme Settings</h3>
                <p className="text-gray-600">Customize your store's appearance</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <select 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="input-field"
                >
                  <option value="light">Light Theme</option>
                  <option value="dark">Dark Theme</option>
                  <option value="auto">Auto (System)</option>
                </select>
                
                <button className="btn-secondary flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Logo
                </button>
              </div>
            </div>
            
            {/* Color Palette */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Color Palette</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {themeColors.map((color) => (
                  <div key={color.variable} className="text-center">
                    <div 
                      className="h-16 w-full rounded-lg mb-2 border border-gray-200"
                      style={{ backgroundColor: color.value }}
                    ></div>
                    <div className="text-sm font-medium text-gray-900">{color.name}</div>
                    <div className="text-xs text-gray-500">{color.value}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Typography */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Typography</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <select className="input-field">
                    <option>Inter</option>
                    <option>Roboto</option>
                    <option>Open Sans</option>
                    <option>Montserrat</option>
                    <option>Poppins</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Font Size
                  </label>
                  <select className="input-field">
                    <option>16px (Default)</option>
                    <option>14px</option>
                    <option>15px</option>
                    <option>17px</option>
                    <option>18px</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Device Preview */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Device Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="relative mx-auto w-64 h-96 border-8 border-gray-800 rounded-3xl">
                  <div className="absolute inset-0 bg-gray-100 rounded-2xl p-4">
                    <div className="h-8 bg-gray-300 rounded mb-4"></div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Mobile</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="relative mx-auto w-80 h-64 border-8 border-gray-800 rounded-lg">
                  <div className="absolute inset-0 bg-gray-100 rounded-sm p-4">
                    <div className="h-8 bg-gray-300 rounded mb-4"></div>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Tablet</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="relative mx-auto w-full h-64 border-8 border-gray-800 rounded-lg">
                  <div className="absolute inset-0 bg-gray-100 rounded-sm p-4">
                    <div className="h-8 bg-gray-300 rounded mb-4"></div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Desktop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">SEO Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  placeholder="Unimarket - Your Online Store"
                  className="input-field"
                />
                <p className="mt-1 text-sm text-gray-500">Recommended: 50-60 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Shop amazing products at unbeatable prices..."
                  className="input-field"
                ></textarea>
                <p className="mt-1 text-sm text-gray-500">Recommended: 150-160 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  placeholder="online shopping, ecommerce, products, store"
                  className="input-field"
                />
                <p className="mt-1 text-sm text-gray-500">Separate keywords with commas</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Social Media</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Open Graph Image
                </label>
                <div className="flex items-center space-x-4">
                  <div className="h-32 w-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <button className="btn-secondary mb-2">
                      Upload Image
                    </button>
                    <p className="text-sm text-gray-500">Recommended: 1200x630 pixels</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter Card Image
                </label>
                <div className="flex items-center space-x-4">
                  <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <button className="btn-secondary mb-2">
                      Upload Image
                    </button>
                    <p className="text-sm text-gray-500">Recommended: 800x418 pixels</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Analysis</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Meta Title Length</span>
                <span className="text-sm font-medium text-green-600">Good</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Meta Description Length</span>
                <span className="text-sm font-medium text-green-600">Good</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Image Alt Tags</span>
                <span className="text-sm font-medium text-yellow-600">Needs Improvement</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Page Speed</span>
                <span className="text-sm font-medium text-red-600">Poor</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Mobile Responsiveness</span>
                <span className="text-sm font-medium text-green-600">Excellent</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Storefront