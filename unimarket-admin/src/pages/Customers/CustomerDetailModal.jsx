// admin/src/pages/Customers/CustomerViewModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  Lock,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  Loader,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Calendar,
  Award,
  DollarSign,
  BookOpen,
  GraduationCap,
  Hash,
  MapPinned,
  Clock,
  Tag,
  FileText,
  UserCheck,
  UserX,
  Heart,
  Bell,
  CreditCard,
  Home,
  Briefcase,
  Link,
  ChevronDown,
  Check,
  AtSign,
  Smartphone,
  Cake,
  Users,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Star,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCheck,
  MailCheck,
  PhoneCall,
  BadgeCheck,
  Award as AwardIcon,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Zap,
  Moon,
  Sun,
  Monitor,
  MessageSquare,
  MailOpen,
  BellRing,
  Radio,
  Github,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Send,
  Gift,
  CreditCard as CreditCardIcon,
  Landmark,
  QrCode,
  ScanLine,
  Fingerprint,
  Key,
  KeyRound,
  ShieldAlert,
  ShieldBan,
  ShieldEllipsis,
  ShieldQuestion,
  ShieldX,
  Unlock,
  LockKeyhole,
  LockKeyholeOpen,
  Fingerprint as FingerprintIcon,
  ScanFace,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Activity,
  AlertOctagon,
  AlertTriangle as AlertTriangleIcon,
  BadgeAlert,
  BadgeCheck as BadgeCheckIcon,
  BadgeInfo,
  BadgeMinus,
  BadgePlus,
  BadgeX,
  Bell as BellIcon,
  BellDot,
  BellMinus,
  BellOff,
  BellPlus,
  BellRing as BellRingIcon,
  Bookmark,
  BookmarkCheck,
  BookmarkMinus,
  BookmarkPlus,
  BookmarkX,
  Calendar as CalendarIcon,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarHeart,
  CalendarMinus,
  CalendarOff,
  CalendarPlus,
  CalendarRange,
  CalendarSearch,
  CalendarX,
  Clock as ClockIcon,
  ClockAlert,
  ClockArrowDown,
  ClockArrowUp,
  ClockFading,
  Hourglass,
  Timer,
  TimerOff,
  TimerReset,
  Edit,
  FileEdit
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

// ============================================
// CONFIGURATION
// ============================================

const CUSTOMER_STATUS = {
  active: { 
    label: 'Active', 
    icon: UserCheck, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    gradient: 'from-green-500 to-green-600',
    borderColor: 'border-green-300'
  },
  inactive: { 
    label: 'Inactive', 
    icon: UserX, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100',
    gradient: 'from-gray-500 to-gray-600',
    borderColor: 'border-gray-300'
  },
  suspended: { 
    label: 'Suspended', 
    icon: AlertCircle, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100',
    gradient: 'from-red-500 to-red-600',
    borderColor: 'border-red-300'
  },
  pending: { 
    label: 'Pending', 
    icon: Clock, 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-100',
    gradient: 'from-yellow-500 to-yellow-600',
    borderColor: 'border-yellow-300'
  },
  deleted: {
    label: 'Deleted',
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    gradient: 'from-gray-500 to-gray-600',
    borderColor: 'border-gray-300'
  }
};

const VERIFICATION_STATUS = {
  verified: { 
    label: 'Verified', 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    gradient: 'from-green-500 to-green-600'
  },
  unverified: { 
    label: 'Unverified', 
    icon: XCircle, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100',
    gradient: 'from-gray-500 to-gray-600'
  }
};

const AUTH_METHODS = {
  email: { label: 'Email', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Mail },
  google: { label: 'Google', color: 'text-red-600', bgColor: 'bg-red-100', icon: Globe }
};

const GENDER_OPTIONS = {
  male: { label: 'Male', icon: User, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  female: { label: 'Female', icon: User, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  other: { label: 'Other', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'prefer not to say': { label: 'Prefer not to say', icon: Shield, color: 'text-gray-600', bgColor: 'bg-gray-100' }
};

const ROLE_OPTIONS = {
  customer: { label: 'Customer', icon: User, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  premium: { label: 'Premium', icon: Star, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  vip: { label: 'VIP', icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  staff: { label: 'Staff', icon: Briefcase, color: 'text-green-600', bgColor: 'bg-green-100' }
};

// Year of study options
const YEAR_OF_STUDY = [
  { value: '1', label: 'Year 1' },
  { value: '2', label: 'Year 2' },
  { value: '3', label: 'Year 3' },
  { value: '4', label: 'Year 4' },
  { value: '5', label: 'Year 5' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'staff', label: 'Staff' }
];

// ============================================
// TAB CONFIGURATION
// ============================================
const TABS = [
  { id: 'basic', label: 'Basic Info', icon: User, color: 'blue' },
  { id: 'personal', label: 'Personal', icon: Heart, color: 'pink' },
  { id: 'academic', label: 'Academic', icon: GraduationCap, color: 'green' },
  { id: 'address', label: 'Address', icon: MapPin, color: 'amber' },
  { id: 'account', label: 'Account', icon: Shield, color: 'purple' },
  { id: 'preferences', label: 'Preferences', icon: Globe, color: 'indigo' },
  { id: 'additional', label: 'Additional', icon: FileText, color: 'gray' }
];

// ============================================
// DISPLAY FIELD COMPONENTS
// ============================================

const DisplayField = ({ label, value, icon: Icon, formatValue, className = '' }) => {
  const formattedValue = formatValue ? formatValue(value) : value;
  
  return (
    <div className={`bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow ${className}`}>
      <div className="flex items-start">
        {Icon && (
          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 border border-gray-200">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-sm font-medium text-gray-900 break-words">
            {formattedValue || <span className="text-gray-400">Not provided</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

const DisplayBadge = ({ value, config, icon: Icon }) => {
  if (!value || !config) return null;
  
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} shadow-sm`}>
      {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
      {config.label || value}
    </span>
  );
};

const DisplayTags = ({ tags }) => {
  if (!tags || tags.length === 0) {
    return <span className="text-sm text-gray-400">No tags</span>;
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 text-xs font-medium border border-primary-200 shadow-sm"
        >
          <Tag className="h-3 w-3 mr-1.5" />
          {tag}
        </span>
      ))}
    </div>
  );
};

const DisplayBoolean = ({ value, trueLabel = 'Yes', falseLabel = 'No' }) => {
  return value ? (
    <span className="inline-flex items-center text-green-600">
      <CheckCircle className="h-4 w-4 mr-1" />
      <span className="text-sm font-medium">{trueLabel}</span>
    </span>
  ) : (
    <span className="inline-flex items-center text-gray-400">
      <XCircle className="h-4 w-4 mr-1" />
      <span className="text-sm font-medium">{falseLabel}</span>
    </span>
  );
};

const DisplayCurrency = ({ value, currency = 'KES' }) => {
  if (!value && value !== 0) return <span className="text-gray-400">—</span>;
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const DisplayDate = ({ date, format: dateFormat = 'PPP' }) => {
  if (!date) return <span className="text-gray-400">—</span>;
  
  try {
    return format(new Date(date), dateFormat);
  } catch {
    return <span className="text-gray-400">Invalid date</span>;
  }
};

const DisplayRelativeTime = ({ date }) => {
  if (!date) return <span className="text-gray-400">—</span>;
  
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return <span className="text-gray-400">Invalid date</span>;
  }
};

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
      <div className="p-2 bg-primary-100 rounded-lg">
        <Icon className="h-4 w-4 text-primary-600" />
      </div>
      <span className="font-semibold text-gray-900">{title}</span>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

const TabButton = ({ tab, isActive, onClick }) => {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center space-x-2 ${
        isActive
          ? `bg-${tab.color}-50 text-${tab.color}-700 shadow-sm`
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon className={`h-4 w-4 ${isActive ? `text-${tab.color}-600` : 'text-gray-500'}`} />
      <span>{tab.label}</span>
      {isActive && (
        <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-${tab.color}-600`} />
      )}
    </button>
  );
};

// Pattern overlay component
const PatternOverlay = () => (
  <div className="absolute inset-0 opacity-20" 
    style={{ 
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` 
    }}
  />
);

// ============================================
// MAIN COMPONENT
// ============================================

const CustomerViewModal = ({ customer, onClose, onEdit }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [customerData, setCustomerData] = useState(null);

  useEffect(() => {
    if (customer) {
      setCustomerData(customer);
    }
  }, [customer]);

  const getInitials = () => {
    if (!customerData) return 'U';
    if (customerData.firstName && customerData.lastName) {
      return `${customerData.firstName[0]}${customerData.lastName[0]}`.toUpperCase();
    }
    if (customerData.firstName) return customerData.firstName[0].toUpperCase();
    if (customerData.email) return customerData.email[0].toUpperCase();
    return 'U';
  };

  const getAvatarColor = () => {
    if (!customerData?.email) return 'from-blue-500 to-blue-600';
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-amber-500 to-amber-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600'
    ];
    const index = customerData.email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const calculateAge = () => {
    if (!customerData?.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(customerData.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusConfig = () => {
    if (!customerData) return CUSTOMER_STATUS.active;
    if (customerData.isDeleted) return CUSTOMER_STATUS.deleted;
    if (!customerData.isActive) return CUSTOMER_STATUS.inactive;
    if (customerData.loginLockoutUntil && new Date(customerData.loginLockoutUntil) > new Date()) return CUSTOMER_STATUS.suspended;
    if (!customerData.isVerified) return CUSTOMER_STATUS.pending;
    return CUSTOMER_STATUS.active;
  };

  const getVerificationConfig = () => {
    return customerData?.isVerified ? VERIFICATION_STATUS.verified : VERIFICATION_STATUS.unverified;
  };

  const getAuthConfig = () => {
    return AUTH_METHODS[customerData?.authMethod] || AUTH_METHODS.email;
  };

  const getGenderConfig = () => {
    return GENDER_OPTIONS[customerData?.gender] || GENDER_OPTIONS['prefer not to say'];
  };

  const getRoleConfig = () => {
    return ROLE_OPTIONS[customerData?.role] || ROLE_OPTIONS.customer;
  };

  const handleCopyId = () => {
    if (customerData?._id) {
      navigator.clipboard.writeText(customerData._id);
      showToast('Customer ID copied to clipboard', 'success');
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(customerData);
    }
  };

  if (!customerData) return null;

  const statusConfig = getStatusConfig();
  const verificationConfig = getVerificationConfig();
  const authConfig = getAuthConfig();
  const genderConfig = getGenderConfig();
  const roleConfig = getRoleConfig();
  const StatusIcon = statusConfig.icon;
  const VerificationIcon = verificationConfig.icon;
  const AuthIcon = authConfig.icon;
  const GenderIcon = genderConfig.icon;
  const RoleIcon = roleConfig.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop with blur */}
        <div 
          onClick={onClose} 
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header with Gradient */}
          <div className="relative px-8 py-6 bg-gradient-to-r from-primary-600 to-primary-700">
            <PatternOverlay />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm ring-1 ring-white/30">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Customer Details</h3>
                  <p className="text-sm text-white/80 mt-1">
                    Viewing customer information
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
              >
                <X className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 relative z-10">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-white/70">Full Name</p>
                <p className="text-sm font-semibold text-white mt-1">
                  {customerData.firstName || '—'} {customerData.lastName || '—'}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-white/70">Email</p>
                <p className="text-sm font-semibold text-white mt-1 truncate">
                  {customerData.email || '—'}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-white/70">Username</p>
                <p className="text-sm font-semibold text-white mt-1">
                  {customerData.username ? `@${customerData.username}` : '—'}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-white/70">Age</p>
                <p className="text-sm font-semibold text-white mt-1">
                  {calculateAge() ? `${calculateAge()} years` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Avatar Preview & Status */}
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${getAvatarColor()} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                  {getInitials()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Customer Avatar</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    Auto-generated from name and email
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${statusConfig.bgColor} ${statusConfig.color}`}>
                  <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                  {statusConfig.label}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors group relative"
                  title="Copy Customer ID"
                >
                  <Copy className="h-4 w-4 text-gray-600 group-hover:scale-110 transition-transform" />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Copy ID
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="px-8 border-b border-gray-200 bg-white">
            <nav className="flex space-x-2 overflow-x-auto py-3">
              {TABS.map(tab => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="px-8 py-6 max-h-[60vh] overflow-y-auto bg-gray-50">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <SectionCard title="Personal Information" icon={User}>
                  <div className="grid grid-cols-2 gap-4">
                    <DisplayField 
                      label="First Name" 
                      value={customerData.firstName} 
                      icon={User}
                    />
                    <DisplayField 
                      label="Last Name" 
                      value={customerData.lastName} 
                      icon={User}
                    />
                    <DisplayField 
                      label="Date of Birth" 
                      value={customerData.dateOfBirth} 
                      icon={Calendar}
                      formatValue={(v) => v ? `${format(new Date(v), 'PPP')} (${calculateAge()} years)` : null}
                    />
                    <DisplayField 
                      label="Gender" 
                      value={customerData.gender} 
                      icon={Heart}
                      formatValue={(v) => genderConfig.label}
                    />
                    <DisplayField 
                      label="National ID Number" 
                      value={customerData.idNumber} 
                      icon={Hash}
                    />
                    <DisplayField 
                      label="Nationality" 
                      value={customerData.nationality} 
                      icon={Globe}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Contact Information" icon={Phone}>
                  <div className="grid grid-cols-2 gap-4">
                    <DisplayField 
                      label="Email Address" 
                      value={customerData.email} 
                      icon={Mail}
                    />
                    <DisplayField 
                      label="Username" 
                      value={customerData.username ? `@${customerData.username}` : null} 
                      icon={AtSign}
                    />
                    <DisplayField 
                      label="Phone Number" 
                      value={customerData.phone} 
                      icon={Phone}
                    />
                    <DisplayField 
                      label="Alternative Phone" 
                      value={customerData.alternativePhone} 
                      icon={Smartphone}
                    />
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Personal Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <SectionCard title="Emergency Contact" icon={Heart}>
                  <div className="grid grid-cols-2 gap-4">
                    <DisplayField 
                      label="Emergency Contact Name" 
                      value={customerData.emergencyName} 
                      icon={User}
                    />
                    <DisplayField 
                      label="Relationship" 
                      value={customerData.emergencyRelationship} 
                      icon={Heart}
                    />
                    <DisplayField 
                      label="Emergency Phone" 
                      value={customerData.emergencyPhone} 
                      icon={Phone}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Business Information" icon={Briefcase}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <DisplayBoolean value={customerData.isBusiness} trueLabel="Business Account" falseLabel="Personal Account" />
                    </div>
                    
                    {customerData.isBusiness && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <DisplayField 
                          label="Business Name" 
                          value={customerData.businessName} 
                          icon={Building}
                        />
                        <DisplayField 
                          label="Business Registration Number" 
                          value={customerData.businessRegNumber} 
                          icon={Hash}
                        />
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Academic Tab */}
            {activeTab === 'academic' && (
              <SectionCard title="Academic Information" icon={GraduationCap}>
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField 
                    label="University" 
                    value={customerData.university} 
                    icon={GraduationCap}
                  />
                  <DisplayField 
                    label="Faculty" 
                    value={customerData.faculty} 
                    icon={BookOpen}
                  />
                  <DisplayField 
                    label="Department" 
                    value={customerData.department} 
                    icon={BookOpen}
                  />
                  <DisplayField 
                    label="Year of Study" 
                    value={customerData.yearOfStudy} 
                    icon={Calendar}
                    formatValue={(v) => {
                      const year = YEAR_OF_STUDY.find(y => y.value === v);
                      return year ? year.label : v;
                    }}
                  />
                  <DisplayField 
                    label="Registration Number" 
                    value={customerData.registrationNumber} 
                    icon={Hash}
                  />
                  <DisplayField 
                    label="Student ID" 
                    value={customerData.studentId} 
                    icon={Hash}
                  />
                </div>
              </SectionCard>
            )}

            {/* Address Tab */}
            {activeTab === 'address' && (
              <SectionCard title="Address Information" icon={MapPin}>
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField 
                    label="Street Address" 
                    value={customerData.address} 
                    icon={Home}
                  />
                  <DisplayField 
                    label="Estate/Area" 
                    value={customerData.estate} 
                    icon={Building}
                  />
                  <DisplayField 
                    label="City/Town" 
                    value={customerData.city} 
                    icon={MapPin}
                  />
                  <DisplayField 
                    label="County" 
                    value={customerData.county} 
                    icon={MapPinned}
                  />
                  <DisplayField 
                    label="Postal Code" 
                    value={customerData.postalCode} 
                    icon={Hash}
                  />
                </div>
              </SectionCard>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <SectionCard title="Account Information" icon={Shield}>
                  <div className="grid grid-cols-2 gap-4">
                    <DisplayField 
                      label="Account Status" 
                      value={statusConfig.label} 
                      icon={Shield}
                    />
                    <DisplayField 
                      label="Verification Status" 
                      value={verificationConfig.label} 
                      icon={BadgeCheck}
                    />
                    <DisplayField 
                      label="Auth Method" 
                      value={authConfig.label} 
                      icon={Globe}
                    />
                    <DisplayField 
                      label="User Role" 
                      value={roleConfig.label} 
                      icon={Award}
                    />
                    <DisplayField 
                      label="Loyalty Points" 
                      value={customerData.loyaltyPoints} 
                      icon={Star}
                      formatValue={(v) => v?.toLocaleString()}
                    />
                    <DisplayField 
                      label="Login Count" 
                      value={customerData.loginCount} 
                      icon={Activity}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Verification Details" icon={CheckCircle}>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Identity Verified</p>
                      <DisplayBoolean value={customerData.isVerified} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Email Verified</p>
                      <DisplayBoolean value={customerData.isEmailVerified} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Phone Verified</p>
                      <DisplayBoolean value={customerData.isPhoneVerified} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Security Info" icon={Lock}>
                  <div className="grid grid-cols-2 gap-4">
                    <DisplayField 
                      label="Two-Factor Auth" 
                      value={customerData.twoFactorEnabled ? 'Enabled' : 'Disabled'} 
                      icon={Shield}
                    />
                    <DisplayField 
                      label="Last Password Change" 
                      value={customerData.passwordChangedAt} 
                      icon={Key}
                      formatValue={(v) => v ? format(new Date(v), 'PPP') : 'Never'}
                    />
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <SectionCard title="Regional Settings" icon={Globe}>
                  <div className="grid grid-cols-2 gap-4">
                    <DisplayField 
                      label="Currency" 
                      value={customerData.currency} 
                      icon={DollarSign}
                    />
                    <DisplayField 
                      label="Language" 
                      value={customerData.language === 'en' ? 'English' : 'Swahili'} 
                      icon={Globe}
                    />
                    <DisplayField 
                      label="Timezone" 
                      value={customerData.timezone} 
                      icon={Clock}
                    />
                    <DisplayField 
                      label="Preferred Payment" 
                      value={customerData.preferredPaymentMethod} 
                      icon={CreditCard}
                    />
                    <DisplayField 
                      label="Theme" 
                      value={customerData.theme} 
                      icon={Monitor}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Notification Preferences" icon={Bell}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Email Notifications</p>
                      <DisplayBoolean value={customerData.emailNotifications} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">SMS Notifications</p>
                      <DisplayBoolean value={customerData.smsNotifications} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Push Notifications</p>
                      <DisplayBoolean value={customerData.pushNotifications} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Newsletter</p>
                      <DisplayBoolean value={customerData.newsletter} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Promotional Emails</p>
                      <DisplayBoolean value={customerData.promotionalEmails} />
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Additional Tab */}
            {activeTab === 'additional' && (
              <div className="space-y-6">
                <SectionCard title="Additional Information" icon={FileText}>
                  <div className="space-y-6">
                    <DisplayField 
                      label="Referral Source" 
                      value={customerData.referralSource} 
                      icon={Link}
                    />

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                        <Tag className="h-3.5 w-3.5 mr-1.5" />
                        Tags
                      </p>
                      <DisplayTags tags={customerData.tags} />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        Notes
                      </p>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {customerData.notes || <span className="text-gray-400">No notes provided</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Account Timeline" icon={Clock}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Account Created</span>
                      <span className="text-sm font-medium text-gray-900">
                        <DisplayDate date={customerData.createdAt} />
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Last Active</span>
                      <span className="text-sm font-medium text-gray-900">
                        {customerData.lastActive ? (
                          <>
                            <DisplayDate date={customerData.lastActive} /> (
                            <DisplayRelativeTime date={customerData.lastActive} />)
                          </>
                        ) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Last Login</span>
                      <span className="text-sm font-medium text-gray-900">
                        {customerData.lastLogin ? (
                          <>
                            <DisplayDate date={customerData.lastLogin} /> (
                            <DisplayRelativeTime date={customerData.lastLogin} />)
                          </>
                        ) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm font-medium text-gray-900">
                        <DisplayDate date={customerData.updatedAt} />
                      </span>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}
          </div>

          {/* Footer with Edit Button */}
          <div className="px-8 py-4 bg-white border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleEditClick}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all text-sm font-medium flex items-center shadow-md hover:shadow-lg"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerViewModal;