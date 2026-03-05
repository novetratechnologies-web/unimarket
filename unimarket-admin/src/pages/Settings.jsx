import React, { useState } from 'react'
import { 
  Save,
  Globe,
  CreditCard,
  Truck,
  Bell,
  Shield,
  Users,
  Palette,
  Store,
  Mail,
  Lock,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Edit
} from 'lucide-react'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    general: {
      storeName: 'Unimarket Store',
      storeEmail: 'contact@unimarket.com',
      storePhone: '+1 (555) 123-4567',
      storeAddress: '123 Business St, City, State 12345',
      currency: 'USD',
      timezone: 'America/New_York',
    },
    payment: {
      stripeEnabled: true,
      paypalEnabled: true,
      cashOnDelivery: true,
      defaultPayment: 'stripe',
    },
    shipping: {
      freeShippingThreshold: 50,
      flatRateShipping: 4.99,
      shippingZones: ['US', 'Canada', 'Europe'],
    },
    notifications: {
      orderEmail: true,
      orderSMS: false,
      marketingEmail: true,
      lowStockAlert: true,
    }
  })

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ]

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleSave = () => {
    console.log('Saving settings:', settings)
    // Add save logic here
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Store Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name
            </label>
            <input
              type="text"
              value={settings.general.storeName}
              onChange={(e) => handleInputChange('general', 'storeName', e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Email
              </label>
              <input
                type="email"
                value={settings.general.storeEmail}
                onChange={(e) => handleInputChange('general', 'storeEmail', e.target.value)}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Phone
              </label>
              <input
                type="tel"
                value={settings.general.storePhone}
                onChange={(e) => handleInputChange('general', 'storePhone', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Address
            </label>
            <textarea
              value={settings.general.storeAddress}
              onChange={(e) => handleInputChange('general', 'storeAddress', e.target.value)}
              className="input-field"
              rows="3"
            />
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Regional Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={settings.general.currency}
              onChange={(e) => handleInputChange('general', 'currency', e.target.value)}
              className="input-field"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={settings.general.timezone}
              onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
              className="input-field"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Stripe</h4>
                <p className="text-sm text-gray-500">Credit card payments</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.payment.stripeEnabled}
                onChange={(e) => handleInputChange('payment', 'stripeEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg mr-3">
                <CreditCard className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">PayPal</h4>
                <p className="text-sm text-gray-500">PayPal payments</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.payment.paypalEnabled}
                onChange={(e) => handleInputChange('payment', 'paypalEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg mr-3">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Cash on Delivery</h4>
                <p className="text-sm text-gray-500">Pay when delivered</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.payment.cashOnDelivery}
                onChange={(e) => handleInputChange('payment', 'cashOnDelivery', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Settings</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Payment Method
          </label>
          <select
            value={settings.payment.defaultPayment}
            onChange={(e) => handleInputChange('payment', 'defaultPayment', e.target.value)}
            className="input-field"
          >
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
            <option value="cod">Cash on Delivery</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderShippingSettings = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Shipping Rates</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Free Shipping Threshold
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                value={settings.shipping.freeShippingThreshold}
                onChange={(e) => handleInputChange('shipping', 'freeShippingThreshold', e.target.value)}
                className="input-field pl-7"
                min="0"
                step="0.01"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Free shipping for orders above this amount
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Flat Rate Shipping
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                value={settings.shipping.flatRateShipping}
                onChange={(e) => handleInputChange('shipping', 'flatRateShipping', e.target.value)}
                className="input-field pl-7"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Shipping Zones</h3>
        <div className="space-y-3">
          {settings.shipping.shippingZones.map((zone, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-gray-400 mr-3" />
                <span className="font-medium text-gray-900">{zone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-400 hover:text-blue-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600">
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400">
            + Add Shipping Zone
          </button>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Order Notifications</h4>
              <p className="text-sm text-gray-500">Receive email for new orders</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.orderEmail}
                onChange={(e) => handleInputChange('notifications', 'orderEmail', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Marketing Emails</h4>
              <p className="text-sm text-gray-500">Receive promotional emails</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.marketingEmail}
                onChange={(e) => handleInputChange('notifications', 'marketingEmail', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Low Stock Alerts</h4>
              <p className="text-sm text-gray-500">Get notified when stock is low</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.lowStockAlert}
                onChange={(e) => handleInputChange('notifications', 'lowStockAlert', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">SMS Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Order SMS</h4>
              <p className="text-sm text-gray-500">Receive SMS for new orders</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.orderSMS}
                onChange={(e) => handleInputChange('notifications', 'orderSMS', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch(activeTab) {
      case 'general':
        return renderGeneralSettings()
      case 'payment':
        return renderPaymentSettings()
      case 'shipping':
        return renderShippingSettings()
      case 'notifications':
        return renderNotificationSettings()
      default:
        return (
          <div className="card">
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h3>
              <p className="text-gray-600">Settings for this section are under development</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure your store settings</p>
          </div>
          <button 
            onClick={handleSave}
            className="btn-primary flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Tabs */}
        <div className="lg:w-64">
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <nav className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center px-4 py-3 rounded-lg mb-1
                      transition-colors duration-200
                      ${activeTab === tab.id 
                        ? 'bg-primary-50 text-primary-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
          
          {/* Backup & Restore */}
          <div className="card mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup & Restore</h3>
            <div className="space-y-3">
              <button className="w-full btn-secondary flex items-center justify-center">
                <Download className="h-5 w-5 mr-2" />
                Backup Settings
              </button>
              <button className="w-full btn-secondary flex items-center justify-center">
                <Upload className="h-5 w-5 mr-2" />
                Restore Settings
              </button>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {renderContent()}
          
          {/* Danger Zone */}
          {activeTab === 'general' && (
            <div className="mt-6">
              <div className="card border-red-200 bg-red-50">
                <h3 className="text-lg font-semibold text-red-800 mb-4">Danger Zone</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-800">Reset All Settings</h4>
                      <p className="text-sm text-red-600">Reset all settings to default values</p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50">
                      Reset
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-800">Delete Store Data</h4>
                      <p className="text-sm text-red-600">Permanently delete all store data</p>
                    </div>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings