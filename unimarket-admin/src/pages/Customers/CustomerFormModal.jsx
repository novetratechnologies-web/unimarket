// admin/src/pages/Customers/CustomerEditModal.jsx
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
  Sparkles,
  Star,
  ShieldCheck,
  AlertTriangle,
  Info,
  MailCheck,
  PhoneCall,
  BadgeCheck,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Zap,
  Moon,
  Sun,
  Monitor,
  MessageSquare,
  BellRing,
  Radio,
  Gift,
  CreditCard as CreditCardIcon,
  Landmark,
  Key,
  ShieldAlert,
  ShieldBan,
  ShieldOff,
  Unlock,
  LockKeyhole,
  Activity,
  BadgeAlert,
  BadgeInfo,
  Calendar as CalendarIcon,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Clock as ClockIcon,
  Timer,
  Hourglass,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  UserRoundMinus,
  UserRoundPlus,
  UsersRound,
  Flag,
  FlagTriangleRight,
  Target,
  Zap as ZapIcon,
  Flame,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  Ban,
  FileEdit
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

// ============================================
// CONFIGURATION
// ============================================

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', icon: UserRound, color: 'blue' },
  { value: 'female', label: 'Female', icon: UserRound, color: 'pink' },
  { value: 'other', label: 'Other', icon: UsersRound, color: 'purple' },
  { value: 'prefer not to say', label: 'Prefer not to say', icon: Shield, color: 'gray' }
];

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Customer', icon: UserRound, color: 'blue' },
  { value: 'premium', label: 'Premium', icon: Star, color: 'amber' },
  { value: 'vip', label: 'VIP', icon: Award, color: 'purple' },
  { value: 'staff', label: 'Staff', icon: Briefcase, color: 'green' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', icon: UserCheck, color: 'green' },
  { value: 'inactive', label: 'Inactive', icon: UserX, color: 'gray' },
  { value: 'suspended', label: 'Suspended', icon: ShieldAlert, color: 'red' },
  { value: 'pending', label: 'Pending', icon: Clock, color: 'yellow' }
];

const AUTH_METHODS = [
  { value: 'email', label: 'Email', icon: Mail, color: 'blue' },
  { value: 'google', label: 'Google', icon: Globe, color: 'red' }
];

const CURRENCY_OPTIONS = [
  { value: 'KES', label: 'KES - Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { value: 'UGX', label: 'UGX - Ugandan Shilling', symbol: 'USh', flag: '🇺🇬' },
  { value: 'TZS', label: 'TZS - Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$', flag: '🇺🇸' }
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'sw', label: 'Swahili', flag: '🇰🇪' }
];

const TIMEZONE_OPTIONS = [
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', offset: '+3' },
  { value: 'Africa/Kampala', label: 'Kampala (EAT)', offset: '+3' },
  { value: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam (EAT)', offset: '+3' }
];

const PAYMENT_METHODS = [
  { value: 'M-Pesa', label: 'M-Pesa', icon: Smartphone, color: 'green' },
  { value: 'Credit Card', label: 'Credit Card', icon: CreditCardIcon, color: 'blue' },
  { value: 'Debit Card', label: 'Debit Card', icon: CreditCardIcon, color: 'purple' },
  { value: 'Bank Transfer', label: 'Bank Transfer', icon: Landmark, color: 'gray' }
];

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 
  'Uasin Gishu', 'Kakamega', 'Kilifi', 'Meru', 'Garissa', 'Kitui',
  'Mandera', 'Migori', 'Bungoma', 'Busia', 'Laikipia', 'Nandi',
  'Trans Nzoia', 'Turkana', 'Marsabit', 'Samburu', 'Isiolo', 'Tana River',
  'Lamu', 'Kwale', 'Taita Taveta', 'Kajiado', 'Narok', 'Baringo',
  'Elgeyo Marakwet', 'West Pokot', 'Bomet', 'Kericho', 'Nyamira', 'Kisii',
  'Homa Bay', 'Siaya', 'Vihiga', 'Muranga', 'Nyandarua', 'Nyeri',
  'Kirinyaga', 'Embu', 'Tharaka Nithi', 'Makueni', 'Wajir'
];

const UNIVERSITIES = [
  'University of Nairobi',
  'Kenyatta University',
  'Strathmore University',
  'Jomo Kenyatta University of Agriculture and Technology',
  'Moi University',
  'Egerton University',
  'Maseno University',
  'Technical University of Kenya',
  'Technical University of Mombasa',
  'Dedan Kimathi University of Technology',
  'Meru University of Science and Technology',
  'South Eastern Kenya University',
  'Multimedia University of Kenya',
  'University of Eldoret',
  'Masinde Muliro University of Science and Technology',
  'Chuka University',
  'Karatina University',
  'Kisii University',
  'Mount Kenya University',
  'Africa Nazarene University',
  'Catholic University of Eastern Africa',
  'Daystar University',
  'United States International University',
  'Riara University',
  'Zetech University',
  'KCA University',
  'Other'
];

const YEAR_OF_STUDY = [
  { value: '1', label: 'Year 1' },
  { value: '2', label: 'Year 2' },
  { value: '3', label: 'Year 3' },
  { value: '4', label: 'Year 4' },
  { value: '5', label: 'Year 5' },
  { value: '6', label: 'Year 6' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'staff', label: 'Staff' }
];

const REFERRAL_SOURCES = [
  { value: 'Social Media', label: 'Social Media', icon: Users },
  { value: 'Friend/Family', label: 'Friend/Family', icon: Heart },
  { value: 'Advertisement', label: 'Advertisement', icon: Radio },
  { value: 'Search Engine', label: 'Search Engine', icon: Globe },
  { value: 'Campus Event', label: 'Campus Event', icon: Calendar },
  { value: 'Email Campaign', label: 'Email Campaign', icon: Mail },
  { value: 'WhatsApp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'Other', label: 'Other', icon: Link }
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
// FORM FIELD COMPONENTS
// ============================================

const InputField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  icon: Icon, 
  required = false,
  disabled = false,
  placeholder = '',
  type = 'text',
  hint = '',
  className = ''
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-10' : 'px-3'} pr-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
    </div>
    {error && (
      <p className="mt-1 text-xs text-red-600 flex items-center">
        <AlertCircle className="h-3 w-3 mr-1" />
        {error}
      </p>
    )}
    {hint && !error && (
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    )}
  </div>
);

const SelectField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  icon: Icon, 
  options = [], 
  required = false,
  placeholder = 'Select option',
  className = ''
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full ${Icon ? 'pl-10' : 'px-3'} pr-8 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
    </div>
    {error && (
      <p className="mt-1 text-xs text-red-600 flex items-center">
        <AlertCircle className="h-3 w-3 mr-1" />
        {error}
      </p>
    )}
  </div>
);

const CheckboxField = ({ label, name, checked, onChange, description = '' }) => (
  <label className="flex items-start space-x-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
    />
    <div className="flex-1">
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
        {label}
      </span>
      {description && (
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      )}
    </div>
  </label>
);

const RadioGroup = ({ label, name, value, onChange, options = [], className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="space-y-2">
      {options.map(option => {
        const Icon = option.icon;
        const isSelected = value === option.value;
        return (
          <label
            key={option.value}
            className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
              isSelected
                ? `border-${option.color}-500 bg-${option.color}-50`
                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={onChange}
              className="hidden"
            />
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
              isSelected ? `border-${option.color}-500` : 'border-gray-300'
            }`}>
              {isSelected && (
                <div className={`w-2.5 h-2.5 rounded-full bg-${option.color}-500`} />
              )}
            </div>
            <Icon className={`h-4 w-4 mr-2 ${isSelected ? `text-${option.color}-600` : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${isSelected ? `text-${option.color}-700` : 'text-gray-700'}`}>
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  </div>
);

const TagsInput = ({ tags, onChange, placeholder = 'Add tags...' }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput('');
    }
  };

  const handleRemove = (tagToRemove) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white min-h-[52px]">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 text-xs font-medium border border-primary-200 shadow-sm"
          >
            <Tag className="h-3 w-3 mr-1.5" />
            {tag}
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              className="ml-1.5 hover:text-primary-900 focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[150px] outline-none text-sm bg-transparent px-2 py-1.5"
          placeholder={tags.length === 0 ? placeholder : ''}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500 flex items-center">
        <Info className="h-3 w-3 mr-1" />
        Press Enter to add a tag
      </p>
    </div>
  );
};

const SectionCard = ({ title, icon: Icon, children, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Icon className="h-4 w-4 text-primary-600" />
          </div>
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isExpanded && (
        <div className="p-5 border-t border-gray-100 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

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

const CustomerEditModal = ({ customer, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [otherUniversity, setOtherUniversity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternativePhone: '',
    username: '',
    
    // Personal Info
    dateOfBirth: '',
    gender: '',
    idNumber: '',
    nationality: 'Kenyan',
    
    // Academic
    university: '',
    faculty: '',
    department: '',
    yearOfStudy: '',
    studentId: '',
    registrationNumber: '',
    
    // Address
    address: '',
    city: '',
    county: 'Nairobi',
    postalCode: '',
    estate: '',
    
    // Emergency Contact
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    
    // Account
    password: '',
    confirmPassword: '',
    status: 'active',
    role: 'customer',
    isVerified: false,
    isEmailVerified: false,
    isPhoneVerified: false,
    authMethod: 'email',
    googleId: null,
    loyaltyPoints: 0,
    loginCount: 0,
    
    // Preferences
    currency: 'KES',
    language: 'en',
    timezone: 'Africa/Nairobi',
    preferredPaymentMethod: 'M-Pesa',
    twoFactorEnabled: false,
    theme: 'auto',
    
    // Notifications
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    newsletter: true,
    promotionalEmails: false,
    
    // Business
    isBusiness: false,
    businessName: '',
    businessRegNumber: '',
    
    // Additional
    notes: '',
    tags: [],
    referralSource: '',
    
    // Metadata
    lastLogin: null,
    lastActive: null,
    accountCreated: null
  });

  const [errors, setErrors] = useState({});

  // Load customer data if editing
  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        alternativePhone: customer.alternativePhone || '',
        username: customer.username || '',
        dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
        gender: customer.gender || '',
        idNumber: customer.idNumber || '',
        nationality: customer.nationality || 'Kenyan',
        university: customer.university || '',
        faculty: customer.faculty || '',
        department: customer.department || '',
        yearOfStudy: customer.yearOfStudy || '',
        studentId: customer.studentId || '',
        registrationNumber: customer.registrationNumber || '',
        address: customer.address || '',
        city: customer.city || '',
        county: customer.county || 'Nairobi',
        postalCode: customer.postalCode || '',
        estate: customer.estate || '',
        emergencyName: customer.emergencyName || '',
        emergencyPhone: customer.emergencyPhone || '',
        emergencyRelationship: customer.emergencyRelationship || '',
        password: '',
        confirmPassword: '',
        status: customer.status || (customer.isActive ? 'active' : 'inactive'),
        role: customer.role || 'customer',
        isVerified: customer.isVerified || false,
        isEmailVerified: customer.isEmailVerified || false,
        isPhoneVerified: customer.isPhoneVerified || false,
        authMethod: customer.authMethod || 'email',
        googleId: customer.googleId || null,
        loyaltyPoints: customer.loyaltyPoints || 0,
        loginCount: customer.loginCount || 0,
        currency: customer.currency || 'KES',
        language: customer.language || 'en',
        timezone: customer.timezone || 'Africa/Nairobi',
        preferredPaymentMethod: customer.preferredPaymentMethod || 'M-Pesa',
        twoFactorEnabled: customer.twoFactorEnabled || false,
        theme: customer.theme || 'auto',
        emailNotifications: customer.emailNotifications ?? true,
        smsNotifications: customer.smsNotifications ?? true,
        pushNotifications: customer.pushNotifications ?? true,
        newsletter: customer.newsletter ?? true,
        promotionalEmails: customer.promotionalEmails || false,
        isBusiness: customer.isBusiness || false,
        businessName: customer.businessName || '',
        businessRegNumber: customer.businessRegNumber || '',
        notes: customer.notes || '',
        tags: customer.tags || [],
        referralSource: customer.referralSource || '',
        lastLogin: customer.lastLogin || null,
        lastActive: customer.lastActive || null,
        accountCreated: customer.accountCreated || customer.createdAt || null
      });

      if (customer.university && !UNIVERSITIES.includes(customer.university)) {
        setOtherUniversity(customer.university);
      }
    }
  }, [customer]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation (Kenyan format)
    const kenyanPhoneRegex = /^(?:\+254|0)[17]\d{8}$/;
    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/\s+/g, '');
      if (!kenyanPhoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Invalid Kenyan phone (e.g., 0712345678 or +254712345678)';
      }
    }
    if (formData.alternativePhone) {
      const cleanAltPhone = formData.alternativePhone.replace(/\s+/g, '');
      if (!kenyanPhoneRegex.test(cleanAltPhone)) {
        newErrors.alternativePhone = 'Invalid Kenyan phone number';
      }
    }
    if (formData.emergencyPhone) {
      const cleanEmergencyPhone = formData.emergencyPhone.replace(/\s+/g, '');
      if (!kenyanPhoneRegex.test(cleanEmergencyPhone)) {
        newErrors.emergencyPhone = 'Invalid Kenyan phone number';
      }
    }

    // Username validation
    if (formData.username && !/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) {
      newErrors.username = 'Username must be 3-30 characters (letters, numbers, underscores only)';
    }

    // Date of birth validation
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        if (age - 1 < 13) {
          newErrors.dateOfBirth = 'Customer must be at least 13 years old';
        }
      } else if (age < 13) {
        newErrors.dateOfBirth = 'Customer must be at least 13 years old';
      }
      
      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    // Password validation (only if changing)
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase and number';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Kenyan ID validation
    if (formData.idNumber && !/^\d{7,8}$/.test(formData.idNumber)) {
      newErrors.idNumber = 'Invalid Kenyan ID (7-8 digits)';
    }

    // Student ID validation
    if (formData.studentId && formData.studentId.length < 5) {
      newErrors.studentId = 'Student ID must be at least 5 characters';
    }

    // Business validation
    if (formData.isBusiness) {
      if (!formData.businessName?.trim()) {
        newErrors.businessName = 'Business name is required';
      }
      if (!formData.businessRegNumber?.trim()) {
        newErrors.businessRegNumber = 'Business registration number is required';
      }
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
      const submitData = { 
        ...formData,
        university: formData.university === 'Other' ? otherUniversity : formData.university,
        updatedAt: new Date().toISOString()
      };
      
      // Remove confirmPassword and empty password if not changed
      delete submitData.confirmPassword;
      if (!submitData.password) {
        delete submitData.password;
      }

      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null || submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      const response = await api.put(`/admin/users/${customer._id}`, submitData);

      if (response?.success || response?.data) {
        showToast(
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p className="font-medium">Customer Updated</p>
              <p className="text-sm text-gray-600">
                {formData.email} has been updated successfully
              </p>
            </div>
          </div>,
          'success'
        );
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      showToast(
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <p className="font-medium">Failed to update customer</p>
            <p className="text-sm text-gray-600">{error.response?.data?.message || error.message}</p>
          </div>
        </div>,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    if (formData.firstName) return formData.firstName[0].toUpperCase();
    if (formData.email) return formData.email[0].toUpperCase();
    return 'U';
  };

  const getAvatarColor = () => {
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
    const index = formData.email ? formData.email.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const calculateAge = () => {
    if (!formData.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(formData.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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
                  <FileEdit className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Edit Customer</h3>
                  <p className="text-sm text-white/80 mt-1">
                    Editing {customer?.email}
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
                  {formData.firstName || '—'} {formData.lastName || '—'}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-white/70">Email</p>
                <p className="text-sm font-semibold text-white mt-1 truncate">
                  {formData.email || '—'}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-white/70">Username</p>
                <p className="text-sm font-semibold text-white mt-1">
                  {formData.username ? `@${formData.username}` : '—'}
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

          {/* Avatar Preview */}
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
                    Auto-generated from name and email • Updates automatically
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                  formData.status === 'active' ? 'bg-green-100 text-green-700' :
                  formData.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                  formData.status === 'suspended' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {formData.status === 'active' && <UserCheck className="h-3.5 w-3.5 mr-1.5" />}
                  {formData.status === 'inactive' && <UserX className="h-3.5 w-3.5 mr-1.5" />}
                  {formData.status === 'suspended' && <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />}
                  {formData.status === 'pending' && <Clock className="h-3.5 w-3.5 mr-1.5" />}
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </span>
                {customer && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(customer._id);
                      showToast('Customer ID copied to clipboard', 'success');
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors group relative"
                    title="Copy Customer ID"
                  >
                    <Copy className="h-4 w-4 text-gray-600 group-hover:scale-110 transition-transform" />
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Copy ID
                    </span>
                  </button>
                )}
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

          <form onSubmit={handleSubmit}>
            {/* Form Content */}
            <div className="px-8 py-6 max-h-[60vh] overflow-y-auto bg-gray-50">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <SectionCard title="Personal Information" icon={User}>
                    <div className="grid grid-cols-2 gap-6">
                      <InputField
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        error={errors.firstName}
                        icon={User}
                        required
                        placeholder="John"
                      />
                      <InputField
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        error={errors.lastName}
                        icon={User}
                        required
                        placeholder="Doe"
                      />
                      <InputField
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        error={errors.dateOfBirth}
                        icon={Cake}
                        hint={calculateAge() ? `Age: ${calculateAge()} years` : ''}
                      />
                      <SelectField
                        label="Gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        error={errors.gender}
                        icon={Heart}
                        options={GENDER_OPTIONS}
                        placeholder="Select gender"
                      />
                      <InputField
                        label="National ID Number"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        error={errors.idNumber}
                        icon={Hash}
                        placeholder="12345678"
                        hint="Kenyan ID (7-8 digits)"
                      />
                      <SelectField
                        label="Nationality"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        icon={Globe}
                        options={['Kenyan', 'Ugandan', 'Tanzanian', 'Rwandan', 'Other']}
                      />
                    </div>
                  </SectionCard>

                  <SectionCard title="Contact Information" icon={Phone}>
                    <div className="grid grid-cols-2 gap-6">
                      <InputField
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        error={errors.email}
                        icon={Mail}
                        required
                        disabled
                        placeholder="john.doe@example.com"
                      />
                      <InputField
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        error={errors.username}
                        icon={AtSign}
                        placeholder="johndoe"
                        hint="3-30 characters, letters/numbers/_ only"
                      />
                      <InputField
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        error={errors.phone}
                        icon={Phone}
                        placeholder="0712 345 678"
                      />
                      <InputField
                        label="Alternative Phone"
                        name="alternativePhone"
                        value={formData.alternativePhone}
                        onChange={handleInputChange}
                        error={errors.alternativePhone}
                        icon={Smartphone}
                        placeholder="0733 456 789"
                      />
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* Personal Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <SectionCard title="Emergency Contact" icon={Heart}>
                    <div className="grid grid-cols-2 gap-6">
                      <InputField
                        label="Emergency Contact Name"
                        name="emergencyName"
                        value={formData.emergencyName}
                        onChange={handleInputChange}
                        icon={User}
                        placeholder="Jane Doe"
                      />
                      <InputField
                        label="Relationship"
                        name="emergencyRelationship"
                        value={formData.emergencyRelationship}
                        onChange={handleInputChange}
                        icon={Heart}
                        placeholder="Spouse, Parent, etc."
                      />
                      <InputField
                        label="Emergency Phone"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleInputChange}
                        error={errors.emergencyPhone}
                        icon={Phone}
                        placeholder="0712 345 678"
                      />
                    </div>
                  </SectionCard>

                  <SectionCard title="Business Information" icon={Briefcase}>
                    <div className="space-y-4">
                      <CheckboxField
                        label="This is a business account"
                        name="isBusiness"
                        checked={formData.isBusiness}
                        onChange={handleInputChange}
                        description="Enable for corporate customers and business accounts"
                      />

                      {formData.isBusiness && (
                        <div className="grid grid-cols-2 gap-6 mt-4">
                          <InputField
                            label="Business Name"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleInputChange}
                            error={errors.businessName}
                            icon={Building}
                            required
                            placeholder="ABC Enterprises"
                          />
                          <InputField
                            label="Business Registration Number"
                            name="businessRegNumber"
                            value={formData.businessRegNumber}
                            onChange={handleInputChange}
                            error={errors.businessRegNumber}
                            icon={Hash}
                            required
                            placeholder="BRN-2020-001"
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
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <SelectField
                        label="University/Institution"
                        name="university"
                        value={formData.university}
                        onChange={handleInputChange}
                        icon={GraduationCap}
                        options={UNIVERSITIES}
                        placeholder="Select university"
                      />
                      
                      {formData.university === 'Other' && (
                        <InputField
                          label="Other University Name"
                          value={otherUniversity}
                          onChange={(e) => setOtherUniversity(e.target.value)}
                          icon={BookOpen}
                          placeholder="Enter university name"
                        />
                      )}

                      <InputField
                        label="Faculty"
                        name="faculty"
                        value={formData.faculty}
                        onChange={handleInputChange}
                        icon={BookOpen}
                        placeholder="Engineering"
                      />

                      <InputField
                        label="Department"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        icon={BookOpen}
                        placeholder="Computer Science"
                      />

                      <SelectField
                        label="Year of Study"
                        name="yearOfStudy"
                        value={formData.yearOfStudy}
                        onChange={handleInputChange}
                        icon={Calendar}
                        options={YEAR_OF_STUDY}
                        placeholder="Select year"
                      />

                      <InputField
                        label="Registration Number"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        icon={Hash}
                        placeholder="SCT221-001-2020"
                      />

                      <InputField
                        label="Student ID Number"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        error={errors.studentId}
                        icon={Hash}
                        placeholder="12345/2020"
                      />
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Address Tab */}
              {activeTab === 'address' && (
                <SectionCard title="Address Information" icon={MapPin}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <InputField
                        label="Street Address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        icon={Home}
                        placeholder="123 Kenyatta Avenue"
                      />
                      
                      <InputField
                        label="Estate/Area"
                        name="estate"
                        value={formData.estate}
                        onChange={handleInputChange}
                        icon={Building}
                        placeholder="Kilimani"
                      />

                      <InputField
                        label="City/Town"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        icon={MapPin}
                        placeholder="Nairobi"
                      />

                      <SelectField
                        label="County"
                        name="county"
                        value={formData.county}
                        onChange={handleInputChange}
                        icon={MapPinned}
                        options={KENYAN_COUNTIES}
                      />

                      <InputField
                        label="Postal Code"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        icon={Hash}
                        placeholder="00100"
                      />
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <SectionCard title="Security" icon={Lock}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <InputField
                          label="New Password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleInputChange}
                          error={errors.password}
                          icon={Lock}
                          placeholder="Leave blank to keep current"
                          hint="Minimum 8 characters with uppercase, lowercase and number"
                        />
                        <InputField
                          label="Confirm New Password"
                          name="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          error={errors.confirmPassword}
                          icon={Lock}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={showPassword}
                          onChange={(e) => setShowPassword(e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>Show passwords</span>
                      </label>
                    </div>
                  </SectionCard>

                  <SectionCard title="Account Settings" icon={Shield}>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <SelectField
                          label="Account Status"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          icon={Shield}
                          options={STATUS_OPTIONS}
                        />

                        <SelectField
                          label="Auth Method"
                          name="authMethod"
                          value={formData.authMethod}
                          onChange={handleInputChange}
                          icon={Globe}
                          options={AUTH_METHODS}
                        />

                        <SelectField
                          label="User Role"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          icon={Award}
                          options={ROLE_OPTIONS}
                        />

                        <InputField
                          label="Loyalty Points"
                          name="loyaltyPoints"
                          type="number"
                          value={formData.loyaltyPoints}
                          onChange={handleInputChange}
                          icon={Star}
                          min="0"
                        />

                        <InputField
                          label="Login Count"
                          name="loginCount"
                          type="number"
                          value={formData.loginCount}
                          onChange={handleInputChange}
                          icon={Activity}
                          min="0"
                          disabled
                          hint="Auto-updated on user login"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <CheckboxField
                          label="Identity Verified"
                          name="isVerified"
                          checked={formData.isVerified}
                          onChange={handleInputChange}
                          description="KYC verification status"
                        />
                        <CheckboxField
                          label="Email Verified"
                          name="isEmailVerified"
                          checked={formData.isEmailVerified}
                          onChange={handleInputChange}
                          description="Email confirmation"
                        />
                        <CheckboxField
                          label="Phone Verified"
                          name="isPhoneVerified"
                          checked={formData.isPhoneVerified}
                          onChange={handleInputChange}
                          description="SMS verification"
                        />
                      </div>
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <SectionCard title="Regional Settings" icon={Globe}>
                    <div className="grid grid-cols-2 gap-6">
                      <SelectField
                        label="Currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        icon={DollarSign}
                        options={CURRENCY_OPTIONS}
                      />

                      <SelectField
                        label="Language"
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        icon={Globe}
                        options={LANGUAGE_OPTIONS}
                      />

                      <SelectField
                        label="Timezone"
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleInputChange}
                        icon={Clock}
                        options={TIMEZONE_OPTIONS}
                      />

                      <SelectField
                        label="Preferred Payment Method"
                        name="preferredPaymentMethod"
                        value={formData.preferredPaymentMethod}
                        onChange={handleInputChange}
                        icon={CreditCard}
                        options={PAYMENT_METHODS}
                      />

                      <SelectField
                        label="Theme"
                        name="theme"
                        value={formData.theme}
                        onChange={handleInputChange}
                        icon={Monitor}
                        options={[
                          { value: 'light', label: 'Light' },
                          { value: 'dark', label: 'Dark' },
                          { value: 'auto', label: 'Auto' }
                        ]}
                      />
                    </div>
                  </SectionCard>

                  <SectionCard title="Notification Preferences" icon={Bell}>
                    <div className="grid grid-cols-2 gap-4">
                      <CheckboxField
                        label="Email Notifications"
                        name="emailNotifications"
                        checked={formData.emailNotifications}
                        onChange={handleInputChange}
                        description="Order updates via email"
                      />
                      <CheckboxField
                        label="SMS Notifications"
                        name="smsNotifications"
                        checked={formData.smsNotifications}
                        onChange={handleInputChange}
                        description="Order updates via SMS"
                      />
                      <CheckboxField
                        label="Push Notifications"
                        name="pushNotifications"
                        checked={formData.pushNotifications}
                        onChange={handleInputChange}
                        description="Browser push notifications"
                      />
                      <CheckboxField
                        label="Newsletter"
                        name="newsletter"
                        checked={formData.newsletter}
                        onChange={handleInputChange}
                        description="Receive marketing emails"
                      />
                      <CheckboxField
                        label="Promotional Emails"
                        name="promotionalEmails"
                        checked={formData.promotionalEmails}
                        onChange={handleInputChange}
                        description="Special offers and deals"
                      />
                      <CheckboxField
                        label="Two-Factor Auth"
                        name="twoFactorEnabled"
                        checked={formData.twoFactorEnabled}
                        onChange={handleInputChange}
                        description="Enable 2FA for account"
                      />
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* Additional Tab */}
              {activeTab === 'additional' && (
                <div className="space-y-6">
                  <SectionCard title="Additional Information" icon={FileText}>
                    <div className="space-y-6">
                      <SelectField
                        label="Referral Source"
                        name="referralSource"
                        value={formData.referralSource}
                        onChange={handleInputChange}
                        icon={Link}
                        options={REFERRAL_SOURCES}
                        placeholder="How did they find us?"
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tags
                        </label>
                        <TagsInput
                          tags={formData.tags}
                          onChange={(newTags) => setFormData(prev => ({ ...prev, tags: newTags }))}
                          placeholder="Add customer tags..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows="4"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Additional notes about this customer..."
                        />
                      </div>
                    </div>
                  </SectionCard>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <span className="text-red-500 mr-1">*</span> Required fields
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md hover:shadow-lg min-w-[140px] justify-center"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Customer
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerEditModal;