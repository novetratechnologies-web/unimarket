// admin/src/pages/Customers/GroupFormModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Tag,
  Filter,
  Save,
  Loader,
  RefreshCw,
  Clock,
  AlertCircle,
  Check,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

const GroupFormModal = ({ group, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [tagInput, setTagInput] = useState('');
  const [previewCount, setPreviewCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'static', // static, dynamic, auto
    isActive: true,
    tags: [],
    rules: [],
    conditions: {
      matchType: 'all', // all, any
      rules: []
    },
    settings: {
      allowDuplicates: false,
      notifyOnChange: false,
      autoUpdate: false,
      updateFrequency: 'daily' // hourly, daily, weekly
    },
    metadata: {
      color: '#3B82F6',
      icon: 'users'
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        type: group.type || 'static',
        isActive: group.isActive ?? true,
        tags: group.tags || [],
        rules: group.rules || [],
        conditions: group.conditions || {
          matchType: 'all',
          rules: []
        },
        settings: group.settings || {
          allowDuplicates: false,
          notifyOnChange: false,
          autoUpdate: false,
          updateFrequency: 'daily'
        },
        metadata: group.metadata || {
          color: '#3B82F6',
          icon: 'users'
        }
      });
    }
  }, [group]);

  // Preview member count based on conditions
  useEffect(() => {
    const fetchPreview = async () => {
      if (formData.type === 'dynamic' && formData.conditions.rules.length > 0) {
        try {
          const response = await api.post('/admin/customer-groups/preview', {
            conditions: formData.conditions
          });
          if (response?.success) {
            setPreviewCount(response.count || 0);
          }
        } catch (error) {
          console.error('Failed to fetch preview:', error);
        }
      }
    };

    const timer = setTimeout(fetchPreview, 500);
    return () => clearTimeout(timer);
  }, [formData.conditions]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Group name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setLoading(true);
    try {
      const submitData = { ...formData };

      let response;
      if (group) {
        response = await api.put(`/admin/customer-groups/${group._id}`, submitData);
      } else {
        response = await api.post('/admin/customer-groups', submitData);
      }

      if (response?.success) {
        showToast(
          <div>
            <p className="font-medium">
              {group ? 'Group Updated' : 'Group Created'}
            </p>
            <p className="text-sm opacity-90">
              {formData.name} has been {group ? 'updated' : 'created'} successfully
            </p>
          </div>,
          'success'
        );
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to save group:', error);
      showToast(error.message || 'Failed to save group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        rules: [
          ...prev.conditions.rules,
          { field: 'totalSpent', operator: 'gt', value: 0 }
        ]
      }
    }));
  };

  const updateRule = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        rules: prev.conditions.rules.map((rule, i) => 
          i === index ? { ...rule, [field]: value } : rule
        )
      }
    }));
  };

  const removeRule = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        rules: prev.conditions.rules.filter((_, i) => i !== index)
      }
    }));
  };

  const ruleFields = [
    { value: 'totalSpent', label: 'Total Spent' },
    { value: 'orderCount', label: 'Order Count' },
    { value: 'avgOrderValue', label: 'Average Order Value' },
    { value: 'lastOrderDate', label: 'Last Order Date' },
    { value: 'registrationDate', label: 'Registration Date' },
    { value: 'university', label: 'University' },
    { value: 'yearOfStudy', label: 'Year of Study' },
    { value: 'city', label: 'City' },
    { value: 'county', label: 'County' },
    { value: 'loyaltyPoints', label: 'Loyalty Points' },
    { value: 'isVerified', label: 'Is Verified' },
    { value: 'isEmailVerified', label: 'Email Verified' },
    { value: 'isPhoneVerified', label: 'Phone Verified' }
  ];

  const operators = {
    totalSpent: [
      { value: 'gt', label: 'Greater than' },
      { value: 'lt', label: 'Less than' },
      { value: 'eq', label: 'Equals' },
      { value: 'between', label: 'Between' }
    ],
    orderCount: [
      { value: 'gt', label: 'Greater than' },
      { value: 'lt', label: 'Less than' },
      { value: 'eq', label: 'Equals' },
      { value: 'between', label: 'Between' }
    ],
    lastOrderDate: [
      { value: 'after', label: 'After' },
      { value: 'before', label: 'Before' },
      { value: 'between', label: 'Between' },
      { value: 'last7days', label: 'Last 7 days' },
      { value: 'last30days', label: 'Last 30 days' },
      { value: 'last90days', label: 'Last 90 days' }
    ],
    registrationDate: [
      { value: 'after', label: 'After' },
      { value: 'before', label: 'Before' },
      { value: 'between', label: 'Between' },
      { value: 'last7days', label: 'Last 7 days' },
      { value: 'last30days', label: 'Last 30 days' },
      { value: 'last90days', label: 'Last 90 days' }
    ],
    university: [
      { value: 'eq', label: 'Equals' },
      { value: 'in', label: 'In list' },
      { value: 'contains', label: 'Contains' }
    ],
    isVerified: [
      { value: 'eq', label: 'Equals' }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm" onClick={onClose} />

        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-primary-600 to-blue-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {group ? 'Edit Group' : 'Create New Group'}
                  </h3>
                  <p className="text-sm text-white/80 mt-0.5">
                    {group ? `Editing ${group.name}` : 'Create a customer group'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-gray-200">
            <nav className="flex space-x-6">
              {[
                { id: 'basic', label: 'Basic Info', icon: Tag },
                { id: 'conditions', label: 'Conditions', icon: Filter },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Premium Customers"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Describe the purpose of this group..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="static">Static Group (Manually add members)</option>
                      <option value="dynamic">Dynamic Group (Based on conditions)</option>
                      <option value="auto">Auto Group (System managed)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.type === 'static' && 'Manually add and remove customers'}
                      {formData.type === 'dynamic' && 'Customers automatically added based on rules'}
                      {formData.type === 'auto' && 'System managed groups (e.g., "High Spenders")'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-primary-50 text-primary-700 text-xs"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-primary-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="flex-1 min-w-[120px] outline-none text-sm"
                        placeholder="Add tags (press Enter)"
                      />
                    </div>
                  </div>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Group is active</span>
                  </label>
                </div>
              )}

              {/* Conditions Tab */}
              {activeTab === 'conditions' && (
                <div className="space-y-4">
                  {formData.type === 'dynamic' ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Membership Rules</h4>
                        <button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                          {showPreview ? 'Hide Preview' : 'Show Preview'}
                        </button>
                      </div>

                      {showPreview && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-blue-700">Preview matches</p>
                              <p className="text-2xl font-bold text-blue-800">{previewCount}</p>
                              <p className="text-xs text-blue-600">customers match current rules</p>
                            </div>
                            <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                          </div>
                        </div>
                      )}

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Match Type
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="conditions.matchType"
                              value="all"
                              checked={formData.conditions.matchType === 'all'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Match ALL rules</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="conditions.matchType"
                              value="any"
                              checked={formData.conditions.matchType === 'any'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Match ANY rule</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {formData.conditions.rules.map((rule, index) => (
                          <div key={index} className="flex items-start space-x-2 bg-gray-50 p-3 rounded-lg">
                            <select
                              value={rule.field}
                              onChange={(e) => updateRule(index, 'field', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                            >
                              {ruleFields.map(field => (
                                <option key={field.value} value={field.value}>
                                  {field.label}
                                </option>
                              ))}
                            </select>

                            <select
                              value={rule.operator}
                              onChange={(e) => updateRule(index, 'operator', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                            >
                              {operators[rule.field]?.map(op => (
                                <option key={op.value} value={op.value}>
                                  {op.label}
                                </option>
                              ))}
                            </select>

                            {rule.operator !== 'between' ? (
                              <input
                                type={rule.field.includes('Date') ? 'date' : 'number'}
                                value={rule.value}
                                onChange={(e) => updateRule(index, 'value', e.target.value)}
                                placeholder="Value"
                                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={rule.min || ''}
                                  onChange={(e) => updateRule(index, 'min', e.target.value)}
                                  placeholder="Min"
                                  className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                                />
                                <span>-</span>
                                <input
                                  type="number"
                                  value={rule.max || ''}
                                  onChange={(e) => updateRule(index, 'max', e.target.value)}
                                  placeholder="Max"
                                  className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                                />
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => removeRule(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={addRule}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        + Add Rule
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">
                        {formData.type === 'static' 
                          ? 'Static groups require manual member management'
                          : 'Auto groups are managed by the system'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Color
                    </label>
                    <input
                      type="color"
                      name="metadata.color"
                      value={formData.metadata.color}
                      onChange={handleInputChange}
                      className="w-full h-10 p-1 border border-gray-300 rounded-lg"
                    />
                  </div>

                  {formData.type === 'dynamic' && (
                    <>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="settings.autoUpdate"
                          checked={formData.settings.autoUpdate}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Auto-update group membership</span>
                      </label>

                      {formData.settings.autoUpdate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Update Frequency
                          </label>
                          <select
                            name="settings.updateFrequency"
                            value={formData.settings.updateFrequency}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                      )}

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="settings.notifyOnChange"
                          checked={formData.settings.notifyOnChange}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Notify when members join/leave</span>
                      </label>
                    </>
                  )}

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="settings.allowDuplicates"
                      checked={formData.settings.allowDuplicates}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Allow customers to be in multiple groups</span>
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    {group ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {group ? 'Update Group' : 'Create Group'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupFormModal;