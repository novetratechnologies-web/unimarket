// admin/src/pages/Customers/FilterPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Users,
  Filter,
  Check,
  ChevronDown,
  MapPin,
  ShoppingCart,
  Award,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  GraduationCap,
  Building,
  TrendingUp,
  Star,
  Phone,
  Mail,
  Hash,
  Globe,
  AtSign,
  Smartphone,
  Cake,
  Heart,
  Briefcase,
  BookOpen,
  Tag,
  RotateCcw,
  Save,
  Trash2,
  Archive,
  ArchiveX,
  ArchiveRestore,
  UserCog,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  BadgeCheck,
  BadgeX,
  BadgeAlert,
  BadgeInfo,
  BadgeMinus,
  BadgePlus,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  UserRoundMinus,
  UserRoundPlus,
  UsersRound,
  CalendarRange,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  CalendarHeart,
  CalendarSearch,
  CalendarDays,
  CalendarFold,
  Clock as ClockIcon,
  Timer,
  Hourglass,
  Activity,
  Zap,
  Flame,
  Target,
  Flag,
  FlagTriangleRight,
  FlagTriangleLeft,
  FlagOff
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const FilterPanel = ({ 
  filters, 
  onApply, 
  onClear, 
  onClose,
  universities = [],
  counties = [],
  yearOfStudyOptions = [],
  genderOptions = [],
  roleOptions = []
}) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: [],
    verification: [],
    authMethod: [],
    university: '',
    county: '',
    gender: '',
    role: '',
    yearOfStudy: '',
    faculty: '',
    dateRange: { start: null, end: null },
    minOrders: null,
    maxOrders: null,
    minSpent: null,
    maxSpent: null,
    minAge: null,
    maxAge: null,
    hasPhone: null,
    hasAltPhone: null,
    hasUsername: null,
    hasVerifiedPhone: null,
    hasVerifiedEmail: null,
    tags: [],
    includeDeleted: false
  });
  
  const [datePreset, setDatePreset] = useState('custom');
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    verification: true,
    auth: false,
    university: true,
    county: false,
    academic: false,
    personal: false,
    date: true,
    orders: false,
    spent: false,
    engagement: false,
    tags: false
  });

  // Update local filters when props change
  useEffect(() => {
    if (filters) {
      setLocalFilters(prev => ({
        ...prev,
        ...filters,
        dateRange: filters.dateRange || { start: null, end: null }
      }));
    }
  }, [filters]);

  // Status options with colors
  const statusOptions = [
    { value: 'active', label: 'Active', icon: UserCheck, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700', ringColor: 'ring-green-200' },
    { value: 'inactive', label: 'Inactive', icon: UserX, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700', ringColor: 'ring-gray-200' },
    { value: 'suspended', label: 'Suspended', icon: ShieldAlert, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700', ringColor: 'ring-red-200' },
    { value: 'pending', label: 'Pending', icon: Clock, color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', ringColor: 'ring-yellow-200' },
    { value: 'deleted', label: 'Deleted', icon: Archive, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700', ringColor: 'ring-gray-200' }
  ];

  // Verification options
  const verificationOptions = [
    { value: 'verified', label: 'Verified', icon: BadgeCheck, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700', ringColor: 'ring-green-200' },
    { value: 'unverified', label: 'Unverified', icon: BadgeX, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700', ringColor: 'ring-gray-200' }
  ];

  // Auth method options
  const authMethodOptions = [
    { value: 'email', label: 'Email', icon: Mail, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700', ringColor: 'ring-blue-200' },
    { value: 'google', label: 'Google', icon: Globe, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700', ringColor: 'ring-red-200' }
  ];

  // Gender options
  const genderOptionList = [
    { value: 'male', label: 'Male', icon: UserRound, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700', ringColor: 'ring-blue-200' },
    { value: 'female', label: 'Female', icon: UserRound, color: 'pink', bgColor: 'bg-pink-100', textColor: 'text-pink-700', ringColor: 'ring-pink-200' },
    { value: 'other', label: 'Other', icon: UsersRound, color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700', ringColor: 'ring-purple-200' },
    { value: 'prefer not to say', label: 'Prefer not to say', icon: Shield, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700', ringColor: 'ring-gray-200' }
  ];

  // Role options
  const roleOptionList = [
    { value: 'customer', label: 'Customer', icon: UserRound, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700', ringColor: 'ring-blue-200' },
    { value: 'premium', label: 'Premium', icon: Star, color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-700', ringColor: 'ring-amber-200' },
    { value: 'vip', label: 'VIP', icon: Award, color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700', ringColor: 'ring-purple-200' },
    { value: 'staff', label: 'Staff', icon: Briefcase, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700', ringColor: 'ring-green-200' }
  ];

  // Date preset options
  const datePresets = [
    { value: 'today', label: 'Today', icon: Calendar },
    { value: 'yesterday', label: 'Yesterday', icon: Calendar },
    { value: 'week', label: 'Last 7 Days', icon: CalendarRange },
    { value: 'month', label: 'Last 30 Days', icon: CalendarRange },
    { value: 'quarter', label: 'Last 90 Days', icon: CalendarRange },
    { value: 'year', label: 'Last Year', icon: CalendarDays },
    { value: 'custom', label: 'Custom', icon: CalendarClock }
  ];

  const handleStatusToggle = (status) => {
    setLocalFilters(prev => {
      const current = prev.status || [];
      const updated = current.includes(status)
        ? current.filter(s => s !== status)
        : [...current, status];
      return { ...prev, status: updated };
    });
  };

  const handleVerificationToggle = (value) => {
    setLocalFilters(prev => {
      const current = prev.verification || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, verification: updated };
    });
  };

  const handleAuthMethodToggle = (method) => {
    setLocalFilters(prev => {
      const current = prev.authMethod || [];
      const updated = current.includes(method)
        ? current.filter(m => m !== method)
        : [...current, method];
      return { ...prev, authMethod: updated };
    });
  };

  const handleGenderToggle = (gender) => {
    setLocalFilters(prev => ({
      ...prev,
      gender: prev.gender === gender ? '' : gender
    }));
  };

  const handleRoleToggle = (role) => {
    setLocalFilters(prev => ({
      ...prev,
      role: prev.role === role ? '' : role
    }));
  };

  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const start = new Date();
    
    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end: now }
        }));
        break;
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end }
        }));
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end: now }
        }));
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end: now }
        }));
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end: now }
        }));
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        setLocalFilters(prev => ({
          ...prev,
          dateRange: { start, end: now }
        }));
        break;
      default:
        // custom - keep existing or set to null
        break;
    }
  };

  const handleClearAll = () => {
    setLocalFilters({
      search: '',
      status: [],
      verification: [],
      authMethod: [],
      university: '',
      county: '',
      gender: '',
      role: '',
      yearOfStudy: '',
      faculty: '',
      dateRange: { start: null, end: null },
      minOrders: null,
      maxOrders: null,
      minSpent: null,
      maxSpent: null,
      minAge: null,
      maxAge: null,
      hasPhone: null,
      hasAltPhone: null,
      hasUsername: null,
      hasVerifiedPhone: null,
      hasVerifiedEmail: null,
      tags: [],
      includeDeleted: false
    });
    setDatePreset('custom');
    
    // Call the parent's onClear if provided
    if (onClear) {
      onClear();
    }
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.status?.length) count += localFilters.status.length;
    if (localFilters.verification?.length) count += localFilters.verification.length;
    if (localFilters.authMethod?.length) count += localFilters.authMethod.length;
    if (localFilters.university) count += 1;
    if (localFilters.county) count += 1;
    if (localFilters.gender) count += 1;
    if (localFilters.role) count += 1;
    if (localFilters.yearOfStudy) count += 1;
    if (localFilters.faculty) count += 1;
    if (localFilters.dateRange?.start) count += 1;
    if (localFilters.minOrders || localFilters.maxOrders) count += 1;
    if (localFilters.minSpent || localFilters.maxSpent) count += 1;
    if (localFilters.minAge || localFilters.maxAge) count += 1;
    if (localFilters.hasPhone === true) count += 1;
    if (localFilters.hasAltPhone === true) count += 1;
    if (localFilters.hasUsername === true) count += 1;
    if (localFilters.hasVerifiedPhone === true) count += 1;
    if (localFilters.hasVerifiedEmail === true) count += 1;
    if (localFilters.tags?.length) count += localFilters.tags.length;
    if (localFilters.includeDeleted) count += 1;
    return count;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SectionHeader = ({ title, icon: Icon, section, count }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between text-left group py-2"
    >
      <div className="flex items-center space-x-2">
        <div className={`p-1.5 rounded-lg transition-colors ${
          expandedSections[section] ? 'bg-primary-100' : 'bg-gray-100 group-hover:bg-gray-200'
        }`}>
          <Icon className={`h-4 w-4 ${
            expandedSections[section] ? 'text-primary-600' : 'text-gray-600'
          }`} />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
          {title}
        </span>
        {count > 0 && (
          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
            {count}
          </span>
        )}
      </div>
      <ChevronDown
        className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
          expandedSections[section] ? 'rotate-180' : ''
        }`}
      />
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 mt-4 overflow-hidden animate-slideDown">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Filter className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Filter Customers</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Refine your customer list with advanced filters
              </p>
            </div>
            {getActiveFilterCount() > 0 && (
              <span className="ml-2 px-2.5 py-1 bg-primary-600 text-white rounded-full text-xs font-medium shadow-sm">
                {getActiveFilterCount()} active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Clear all
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Close"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
        <div className="space-y-3">
          {/* Status Section */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="Account Status" icon={Users} section="status" count={localFilters.status?.length} />
            {expandedSections.status && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = localFilters.status?.includes(option.value);
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleStatusToggle(option.value)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? `${option.bgColor} ${option.textColor} ring-2 ${option.ringColor}`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className={`h-3.5 w-3.5 mr-2 ${
                          isSelected ? option.textColor : 'text-gray-500'
                        }`} />
                        {option.label}
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Verification Section */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="Verification Status" icon={BadgeCheck} section="verification" count={localFilters.verification?.length} />
            {expandedSections.verification && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {verificationOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = localFilters.verification?.includes(option.value);
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleVerificationToggle(option.value)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? `${option.bgColor} ${option.textColor} ring-2 ${option.ringColor}`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className={`h-3.5 w-3.5 mr-2 ${
                          isSelected ? option.textColor : 'text-gray-500'
                        }`} />
                        {option.label}
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Auth Method Section */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="Authentication" icon={Shield} section="auth" count={localFilters.authMethod?.length} />
            {expandedSections.auth && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {authMethodOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = localFilters.authMethod?.includes(option.value);
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleAuthMethodToggle(option.value)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? `${option.bgColor} ${option.textColor} ring-2 ${option.ringColor}`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className={`h-3.5 w-3.5 mr-2 ${
                          isSelected ? option.textColor : 'text-gray-500'
                        }`} />
                        {option.label}
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Personal Info Section */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="Personal Info" icon={Heart} section="personal" count={(localFilters.gender ? 1 : 0) + (localFilters.role ? 1 : 0) + ((localFilters.minAge || localFilters.maxAge) ? 1 : 0)} />
            {expandedSections.personal && (
              <div className="mt-4 space-y-4">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Gender</label>
                  <div className="flex flex-wrap gap-2">
                    {genderOptionList.map((option) => {
                      const Icon = option.icon;
                      const isSelected = localFilters.gender === option.value;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => handleGenderToggle(option.value)}
                          className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? `${option.bgColor} ${option.textColor} ring-2 ${option.ringColor}`
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 mr-1.5 ${
                            isSelected ? option.textColor : 'text-gray-500'
                          }`} />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Age Range */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Age Range</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={localFilters.minAge || ''}
                      onChange={(e) => setLocalFilters(prev => ({
                        ...prev,
                        minAge: e.target.value ? parseInt(e.target.value) : null
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="13"
                      max="120"
                    />
                    <span className="text-gray-400">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={localFilters.maxAge || ''}
                      onChange={(e) => setLocalFilters(prev => ({
                        ...prev,
                        maxAge: e.target.value ? parseInt(e.target.value) : null
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="13"
                      max="120"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Role</label>
                  <div className="flex flex-wrap gap-2">
                    {roleOptionList.map((option) => {
                      const Icon = option.icon;
                      const isSelected = localFilters.role === option.value;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => handleRoleToggle(option.value)}
                          className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? `${option.bgColor} ${option.textColor} ring-2 ${option.ringColor}`
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 mr-1.5 ${
                            isSelected ? option.textColor : 'text-gray-500'
                          }`} />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* University Section */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="University" icon={GraduationCap} section="university" count={localFilters.university ? 1 : 0} />
            {expandedSections.university && (
              <div className="mt-4">
                <select
                  value={localFilters.university || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, university: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  <option value="">All Universities</option>
                  {universities.length > 0 ? (
                    universities.map((uni) => (
                      <option key={uni._id || uni} value={uni._id || uni}>
                        {uni.name || uni._id || uni}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="University of Nairobi">University of Nairobi</option>
                      <option value="Kenyatta University">Kenyatta University</option>
                      <option value="Strathmore University">Strathmore University</option>
                      <option value="JKUAT">JKUAT</option>
                      <option value="Moi University">Moi University</option>
                      <option value="Egerton University">Egerton University</option>
                      <option value="Maseno University">Maseno University</option>
                      <option value="Technical University of Kenya">Technical University of Kenya</option>
                      <option value="Other">Other</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* County Section */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="County" icon={MapPin} section="county" count={localFilters.county ? 1 : 0} />
            {expandedSections.county && (
              <div className="mt-4">
                <select
                  value={localFilters.county || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, county: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  <option value="">All Counties</option>
                  {counties.length > 0 ? (
                    counties.map((county) => (
                      <option key={county._id || county} value={county._id || county}>
                        {county.name || county._id || county}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Nairobi">Nairobi</option>
                      <option value="Mombasa">Mombasa</option>
                      <option value="Kisumu">Kisumu</option>
                      <option value="Nakuru">Nakuru</option>
                      <option value="Kiambu">Kiambu</option>
                      <option value="Machakos">Machakos</option>
                      <option value="Uasin Gishu">Uasin Gishu</option>
                      <option value="Kakamega">Kakamega</option>
                      <option value="Kilifi">Kilifi</option>
                      <option value="Meru">Meru</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Academic Section */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="Academic Info" icon={BookOpen} section="academic" count={(localFilters.yearOfStudy ? 1 : 0) + (localFilters.faculty ? 1 : 0)} />
            {expandedSections.academic && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Year of Study</label>
                  <select
                    value={localFilters.yearOfStudy || ''}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, yearOfStudy: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Years</option>
                    {yearOfStudyOptions.length > 0 ? (
                      yearOfStudyOptions.map((year) => (
                        <option key={year._id || year} value={year._id || year}>
                          {year.name || year._id || year}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                        <option value="5">Year 5</option>
                        <option value="graduate">Graduate</option>
                        <option value="postgraduate">Postgraduate</option>
                        <option value="staff">Staff</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Faculty/Department</label>
                  <input
                    type="text"
                    placeholder="e.g., Engineering, Computer Science"
                    value={localFilters.faculty || ''}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, faculty: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="Join Date" icon={Calendar} section="date" count={localFilters.dateRange?.start ? 1 : 0} />
            {expandedSections.date && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {datePresets.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = datePreset === preset.value;
                    return (
                      <button
                        type="button"
                        key={preset.value}
                        onClick={() => handleDatePreset(preset.value)}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-200'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 mr-1.5 ${
                          isSelected ? 'text-primary-600' : 'text-gray-500'
                        }`} />
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {(datePreset === 'custom' || localFilters.dateRange?.start) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">From</label>
                      <DatePicker
                        selected={localFilters.dateRange?.start}
                        onChange={(date) => setLocalFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: date }
                        }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholderText="Start date"
                        dateFormat="MMM d, yyyy"
                        maxDate={new Date()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">To</label>
                      <DatePicker
                        selected={localFilters.dateRange?.end}
                        onChange={(date) => setLocalFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: date }
                        }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholderText="End date"
                        dateFormat="MMM d, yyyy"
                        minDate={localFilters.dateRange?.start}
                        maxDate={new Date()}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Count Range */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="Order Count" icon={ShoppingCart} section="orders" count={(localFilters.minOrders || localFilters.maxOrders) ? 1 : 0} />
            {expandedSections.orders && (
              <div className="mt-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    placeholder="Min orders"
                    value={localFilters.minOrders || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      minOrders: e.target.value ? parseInt(e.target.value) : null
                    }))}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                  <span className="text-gray-400 font-medium">—</span>
                  <input
                    type="number"
                    placeholder="Max orders"
                    value={localFilters.maxOrders || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      maxOrders: e.target.value ? parseInt(e.target.value) : null
                    }))}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Total Spent Range */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="Total Spent (KES)" icon={DollarSign} section="spent" count={(localFilters.minSpent || localFilters.maxSpent) ? 1 : 0} />
            {expandedSections.spent && (
              <div className="mt-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    placeholder="Min KES"
                    value={localFilters.minSpent || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      minSpent: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="100"
                  />
                  <span className="text-gray-400 font-medium">—</span>
                  <input
                    type="number"
                    placeholder="Max KES"
                    value={localFilters.maxSpent || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      maxSpent: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Engagement Section */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="Engagement" icon={Activity} section="engagement" count={
              (localFilters.hasPhone ? 1 : 0) + 
              (localFilters.hasAltPhone ? 1 : 0) + 
              (localFilters.hasUsername ? 1 : 0) +
              (localFilters.hasVerifiedPhone ? 1 : 0) + 
              (localFilters.hasVerifiedEmail ? 1 : 0)
            } />
            {expandedSections.engagement && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={localFilters.hasPhone === true}
                      onChange={(e) => setLocalFilters(prev => ({
                        ...prev,
                        hasPhone: e.target.checked ? true : null
                      }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs text-gray-700">Has phone</span>
                  </label>
                  <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={localFilters.hasAltPhone === true}
                      onChange={(e) => setLocalFilters(prev => ({
                        ...prev,
                        hasAltPhone: e.target.checked ? true : null
                      }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs text-gray-700">Has alt phone</span>
                  </label>
                  <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={localFilters.hasUsername === true}
                      onChange={(e) => setLocalFilters(prev => ({
                        ...prev,
                        hasUsername: e.target.checked ? true : null
                      }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs text-gray-700">Has username</span>
                  </label>
                  <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={localFilters.hasVerifiedPhone === true}
                      onChange={(e) => setLocalFilters(prev => ({
                        ...prev,
                        hasVerifiedPhone: e.target.checked ? true : null
                      }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs text-gray-700">Phone verified</span>
                  </label>
                  <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={localFilters.hasVerifiedEmail === true}
                      onChange={(e) => setLocalFilters(prev => ({
                        ...prev,
                        hasVerifiedEmail: e.target.checked ? true : null
                      }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs text-gray-700">Email verified</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <SectionHeader title="Tags" icon={Tag} section="tags" count={localFilters.tags?.length} />
            {expandedSections.tags && (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Enter tags (comma separated)"
                  value={localFilters.tags?.join(', ') || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    tags: e.target.value ? e.target.value.split(',').map(t => t.trim()) : []
                  }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Separate multiple tags with commas
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{getActiveFilterCount()}</span> active {getActiveFilterCount() === 1 ? 'filter' : 'filters'}
          </div>
          {getActiveFilterCount() > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center shadow-sm"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;