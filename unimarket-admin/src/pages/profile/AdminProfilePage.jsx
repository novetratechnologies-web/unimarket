// admin/src/pages/AdminProfilePage.jsx
import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Key,
  Bell,
  Eye,
  EyeOff,
  Edit2,
  Save,
  X,
  Camera,
  Lock,
  Smartphone,
  Globe,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Users,
  Award,
  Copy,
  Check,
  MoreVertical,
  Trash2,
  LogOut,
  Settings,
  Github,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import adminAPI from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

const AdminProfilePage = () => {
  const { user: authUser, logout } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFilters, setActivityFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  // Data states
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityPagination, setActivityPagination] = useState({ total: 0, pages: 0 });
  const [security, setSecurity] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [stats, setStats] = useState({
    totalLogins: 0,
    uniqueIPs: 0,
    securityScore: 0,
    activeSessions: 0
  });

  // Form state
  const [formData, setFormData] = useState({});

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch profile data
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Fetch activity when tab or page changes
  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivity();
    }
  }, [activeTab, activityPage, activityFilters]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch current admin profile
      const profileRes = await adminAPI.auth.getCurrent();
      if (profileRes?.data) {
        setProfile(profileRes.data);
        setFormData(profileRes.data);
      }

      // Fetch security settings
      const securityRes = await adminAPI.profile.getSecurity();
      if (securityRes?.data) {
        setSecurity(securityRes.data);
        
        // Calculate stats
        setStats({
          totalLogins: securityRes.data.loginAttempts || 0,
          uniqueIPs: new Set(securityRes.data.trustedDevices?.map(d => d.location)).size || 0,
          securityScore: securityRes.data.twoFactorEnabled ? 92 : 65,
          activeSessions: securityRes.data.activeSessions || 0
        });
      }

      // Fetch API keys
      const keysRes = await adminAPI.profile.getApiKeys();
      if (keysRes?.data) {
        setApiKeys(keysRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load profile data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    setActivityLoading(true);
    try {
      const res = await adminAPI.profile.getActivity({
        page: activityPage,
        limit: 10,
        status: activityFilters.status || undefined,
        startDate: activityFilters.startDate || undefined,
        endDate: activityFilters.endDate || undefined
      });
      
      if (res?.data) {
        setActivities(res.data);
        setActivityPagination(res.pagination || { total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await adminAPI.profile.update(formData);
      if (res?.success) {
        setProfile(res.data);
        setIsEditing(false);
        showToast({
          title: 'Success',
          description: 'Profile updated successfully',
          type: 'success'
        });
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await adminAPI.profile.uploadAvatar(formData);
      if (res?.success) {
        setProfile(prev => ({ ...prev, avatar: res.data.avatar }));
        showToast({
          title: 'Success',
          description: 'Avatar updated successfully',
          type: 'success'
        });
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to upload avatar',
        type: 'error'
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast({
        title: 'Error',
        description: 'New passwords do not match',
        type: 'error'
      });
      return;
    }

    try {
      const res = await adminAPI.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (res?.success) {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showToast({
          title: 'Success',
          description: 'Password changed successfully',
          type: 'success'
        });
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        type: 'error'
      });
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast({
      title: 'Copied!',
      description: 'Copied to clipboard',
      type: 'success'
    });
  };

  const handleRevokeSession = async (sessionId) => {
    // Implement session revocation
    showToast({
      title: 'Info',
      description: 'Session revoked',
      type: 'info'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'api', label: 'API Keys', icon: Key }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load profile</h3>
          <button
            onClick={fetchProfileData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header with Cover */}
      <div className="relative h-64 bg-gradient-to-r from-primary-600 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Profile Header Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
                <img 
                  src={profile.avatar || 'https://via.placeholder.com/128'} 
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="absolute -bottom-2 -right-2 p-2 bg-primary-600 text-white rounded-lg shadow-lg hover:bg-primary-700 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleAvatarUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            {/* User Info */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {profile.firstName} {profile.lastName}
                </h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  {profile.role === 'super_admin' ? 'Super Admin' : 'Administrator'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/20"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
              <button
                onClick={logout}
                className="p-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-colors border border-white/20"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          {navigator.onLine ? (
            <span className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <Wifi className="w-4 h-4" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full">
              <WifiOff className="w-4 h-4" />
              Offline
            </span>
          )}
          <span className="text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 mb-6 p-1 flex flex-wrap gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.totalLogins}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Logins</h3>
            <p className="text-xs text-gray-400">Last login: {security?.lastLogin ? new Date(security.lastLogin).toLocaleString() : 'N/A'}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.uniqueIPs}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Unique Locations</h3>
            <p className="text-xs text-gray-400">From {stats.uniqueIPs} different IPs</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.securityScore}%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Security Score</h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.securityScore}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Smartphone className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.activeSessions}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Active Sessions</h3>
            <p className="text-xs text-gray-400">{stats.activeSessions} device{stats.activeSessions !== 1 ? 's' : ''} currently active</p>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName || ''}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName || ''}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phoneNumber || ''}
                          onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={formData.jobTitle || ''}
                          onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <input
                          type="text"
                          value={formData.department || ''}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          value={formData.bio || ''}
                          onChange={(e) => setFormData({...formData, bio: e.target.value})}
                          rows="4"
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.location || ''}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={formData.timezone || ''}
                          onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select timezone</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setFormData(profile);
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoItem icon={User} label="Full Name" value={`${profile.firstName || ''} ${profile.lastName || ''}`.trim()} />
                      <InfoItem icon={Mail} label="Email" value={profile.email} />
                      <InfoItem icon={Phone} label="Phone" value={profile.phoneNumber || 'Not provided'} />
                      <InfoItem icon={Award} label="Job Title" value={profile.jobTitle || 'Not provided'} />
                      <InfoItem icon={Users} label="Department" value={profile.department || 'Not provided'} />
                      <InfoItem icon={MapPin} label="Location" value={profile.location || 'Not provided'} />
                      <InfoItem icon={Clock} label="Timezone" value={profile.timezone || 'Not provided'} />
                      <InfoItem icon={Globe} label="Role" value={profile.role === 'super_admin' ? 'Super Admin' : 'Administrator'} />
                    </div>
                    {profile.bio && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Bio</h3>
                        <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  {/* Password Section */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Lock className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Password</h3>
                          <p className="text-sm text-gray-500">
                            Last changed {profile.passwordChangedAt ? new Date(profile.passwordChangedAt).toLocaleDateString() : 'never'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${security?.twoFactorEnabled ? 'bg-green-100' : 'bg-gray-200'}`}>
                          <Shield className={`w-5 h-5 ${security?.twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-500">
                            {security?.twoFactorEnabled ? 'Enabled - Extra security layer active' : 'Disabled - Recommended for admin accounts'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShow2FAModal(true)}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                          security?.twoFactorEnabled
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {security?.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                      </button>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Active Sessions</h3>
                    <div className="space-y-4">
                      {security?.trustedDevices?.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {device.name}
                                {device.current && (
                                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {device.location} • Last active {new Date(device.lastActive).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {!device.current && (
                            <button
                              onClick={() => handleRevokeSession(device.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {(!security?.trustedDevices || security.trustedDevices.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-4">No active sessions</p>
                      )}
                    </div>
                  </div>

                  {/* Login History */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Recent Login Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Login:</span>
                        <span className="font-medium">
                          {security?.lastLogin ? new Date(security.lastLogin).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last IP Address:</span>
                        <span className="font-medium font-mono">{security?.lastLoginIp || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Failed Login Attempts:</span>
                        <span className="font-medium">{security?.loginAttempts || 0}</span>
                      </div>
                      {security?.lockUntil && security.lockUntil > new Date() && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-700">
                            Account locked until {new Date(security.lockUntil).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                  <div className="flex items-center gap-3">
                    <select
                      value={activityFilters.status}
                      onChange={(e) => setActivityFilters({...activityFilters, status: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                    <button
                      onClick={() => fetchActivity()}
                      className="p-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Activity List */}
                {activityLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading activities...</p>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div
                        key={activity._id}
                        className={`p-4 rounded-xl border ${getStatusColor(activity.status)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getStatusIcon(activity.status)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{activity.action}</h4>
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(activity.createdAt).toLocaleString()}
                                </span>
                                {activity.ipAddress && (
                                  <span className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {activity.ipAddress}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                    <p className="text-gray-500">Your recent activities will appear here</p>
                  </div>
                )}

                {/* Pagination */}
                {activityPagination.pages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                      disabled={activityPage === 1}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {activityPage} of {activityPagination.pages}
                    </span>
                    <button
                      onClick={() => setActivityPage(p => Math.min(activityPagination.pages, p + 1))}
                      disabled={activityPage === activityPagination.pages}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
                  <button
                    onClick={() => {/* Implement key generation */}}
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Generate New Key
                  </button>
                </div>

                {apiKeys.length > 0 ? (
                  <div className="space-y-4">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium text-gray-900">{key.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                key.status === 'active' 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {key.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <code className="px-3 py-1 bg-gray-800 text-gray-200 rounded-lg text-sm font-mono">
                                {key.key.substring(0, 20)}...
                              </code>
                              <button
                                onClick={() => handleCopy(key.key)}
                                className="p-2 text-gray-600 hover:text-gray-900"
                              >
                                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Created: {new Date(key.created).toLocaleDateString()}</span>
                              <span>Last used: {key.lastUsed || 'Never'}</span>
                            </div>
                          </div>
                          <button className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
                    <p className="text-gray-500 mb-6">Generate your first API key to get started</p>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      Generate API Key
                    </button>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">API Key Security</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Keep your API keys secure. Never share them or commit them to version control. 
                        Rotate keys regularly and revoke any that may have been compromised.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <Modal
            title="Change Password"
            onClose={() => {
              setShowPasswordModal(false);
              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* 2FA Modal */}
      <AnimatePresence>
        {show2FAModal && (
          <Modal
            title={security?.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
            onClose={() => setShow2FAModal(false)}
          >
            <div className="space-y-4">
              {!security?.twoFactorEnabled ? (
                <>
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Shield className="w-16 h-16 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4">
                      Two-factor authentication adds an extra layer of security to your account.
                    </p>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Enable 2FA
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-600">
                    Are you sure you want to disable two-factor authentication? This will make your account less secure.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your password to confirm
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShow2FAModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">
                      Disable 2FA
                    </button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Components
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-gray-100 rounded-lg">
      <Icon className="w-4 h-4 text-gray-600" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 overflow-y-auto"
  >
    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 transition-opacity" aria-hidden="true">
        <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
      </div>
      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
      >
        <div className="bg-white px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  </motion.div>
);

export default AdminProfilePage;