// src/pages/settings/components/ProfileTab.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../api/index";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  MapPin,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Heart,
  X,
  Upload,
  Loader,
  AtSign,
  BookOpen,
  Edit2,
  Eye,
  EyeOff,
  UserCircle
} from "lucide-react";

export default function ProfileTab() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingSection, setLoadingSection] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeSubTab, setActiveSubTab] = useState("basic");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState({});
  
  // Local form states
  const [basicForm, setBasicForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    alternativePhone: "",
    university: "",
    dateOfBirth: "",
    gender: "prefer not to say",
    bio: "",
  });

  const [locationForm, setLocationForm] = useState({
    city: "",
    country: "",
  });

  const [socialForm, setSocialForm] = useState({
    github: "",
    twitter: "",
    linkedin: "",
    instagram: "",
  });

  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState("");
  const [errors, setErrors] = useState({});

  const interestSuggestions = [
    "Technology", "Programming", "Design", "Marketing", 
    "Business", "Photography", "Music", "Sports", 
    "Gaming", "Reading", "Travel", "Food",
    "Fashion", "Art", "Science", "Engineering",
    "Books", "Movies", "Fitness", "Cooking",
    "AI", "Machine Learning", "Cloud Computing", "DevOps"
  ];

  // Debug: Log user data whenever it changes
// Update your ProfileTab.jsx logging to show everything
// Update your ProfileTab.jsx logging to show the actual values
useEffect(() => {
  if (user) {
    console.log('🔥 FULL USER OBJECT:', JSON.parse(JSON.stringify(user)));
    console.log('🔥 USER PROPERTIES:', Object.keys(user));
    console.log('🔥 FIRST NAME:', user.firstName);
    console.log('🔥 LAST NAME:', user.lastName);
    console.log('🔥 USERNAME:', user.username);
    console.log('🔥 PHONE:', user.phone);
    console.log('🔥 UNIVERSITY:', user.university);
    console.log('🔥 GENDER:', user.gender);
    console.log('🔥 BIO:', user.bio);
    console.log('🔥 DATE OF BIRTH:', user.dateOfBirth);
    console.log('🔥 ALTERNATIVE PHONE:', user.alternativePhone);
    console.log('🔥 LOCATION:', JSON.stringify(user.location));
    console.log('🔥 SOCIAL LINKS:', JSON.stringify(user.socialLinks));
    console.log('🔥 INTERESTS:', JSON.stringify(user.interests));
    
    // Log the actual values from the object
    console.log('🔍 Checking object keys:', {
      hasUsername: user.hasOwnProperty('username'),
      usernameValue: user.username,
      hasGender: user.hasOwnProperty('gender'),
      genderValue: user.gender,
      hasBio: user.hasOwnProperty('bio'),
      bioValue: user.bio,
      hasDateOfBirth: user.hasOwnProperty('dateOfBirth'),
      dateOfBirthValue: user.dateOfBirth
    });
    
    setBasicForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      phone: user.phone || "",
      alternativePhone: user.alternativePhone || "",
      university: user.university || "",
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
      gender: user.gender || "prefer not to say",
      bio: user.bio || "",
    });

    setLocationForm({
      city: user.location?.city || "",
      country: user.location?.country || "",
    });

    setSocialForm({
      github: user.socialLinks?.github || "",
      twitter: user.socialLinks?.twitter || "",
      linkedin: user.socialLinks?.linkedin || "",
      instagram: user.socialLinks?.instagram || "",
    });

    setInterests(user.interests || []);
  }
}, [user]);




  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasicForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setSocialForm(prev => ({ ...prev, [name]: value }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim()) && interests.length < 20) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest) => {
    setInterests(interests.filter(i => i !== interest));
  };

const handleAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    setMessage({ 
      text: "Please upload a valid image file (JPEG, PNG, GIF, WEBP)", 
      type: "error" 
    });
    e.target.value = ''; // Clear the input
    return;
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    setMessage({ text: "Image size should be less than 5MB", type: "error" });
    e.target.value = ''; // Clear the input
    return;
  }

  // Show preview immediately
  const reader = new FileReader();
  reader.onloadend = () => {
    setAvatarPreview(reader.result);
  };
  reader.readAsDataURL(file);

  // Upload
  setIsUploading(true);
  setMessage({ text: "", type: "" }); // Clear any previous messages

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    console.log('📤 Uploading avatar...', file.name);
    
    const response = await api.post('/profile/avatar', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('📥 Upload response:', response);

    if (response?.success) {
      setMessage({ 
        text: "Avatar updated successfully!", 
        type: "success" 
      });
      
      // Refresh user data to get new avatar URL
      if (refreshUser) {
        await refreshUser();
      }
      
      // Clear preview after success
      setAvatarPreview(null);
    } else {
      throw new Error(response?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    
    let errorMessage = "Failed to upload avatar";
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = "Upload timeout. Please try again.";
    }
    
    setMessage({ 
      text: errorMessage, 
      type: "error" 
    });
    
    // Reset preview on error
    setAvatarPreview(null);
  } finally {
    setIsUploading(false);
    // Clear the input so the same file can be uploaded again
    e.target.value = '';
    
    // Auto-clear message after 5 seconds
    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 5000);
  }
};

  const prepareBasicData = () => {
    return {
      ...basicForm,
      dateOfBirth: basicForm.dateOfBirth || null,
      alternativePhone: basicForm.alternativePhone || null,
      bio: basicForm.bio || null,
      username: basicForm.username || null,
    };
  };

  const handleSubmitBasic = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingSection('basic');
    setMessage({ text: "", type: "" });
    setErrors({});

    try {
      const submitData = prepareBasicData();
      console.log('📤 Submitting basic data:', submitData);
      
      const response = await api.put("/profile", submitData);
      console.log('📥 Update response:', response);
      
      if (response.success) {
        setMessage({ text: "Profile updated successfully!", type: "success" });
        await refreshUser();
        setEditMode(prev => ({ ...prev, basic: false }));
      } else {
        setMessage({ text: response.message || "Failed to update profile", type: "error" });
      }
    } catch (error) {
      console.error("❌ Profile update error:", error);
      
      if (error.response?.data?.errors) {
        const errorMap = {};
        error.response.data.errors.forEach(err => {
          errorMap[err.field] = err.message;
        });
        setErrors(errorMap);
        setMessage({ text: "Please fix the errors below", type: "error" });
      } else {
        setMessage({ 
          text: error.response?.data?.message || "An error occurred", 
          type: "error" 
        });
      }
    } finally {
      setLoading(false);
      setLoadingSection(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingSection('location');
    setMessage({ text: "", type: "" });

    try {
      console.log('📤 Submitting location:', locationForm);
      const response = await api.put("/profile/location", locationForm);
      console.log('📥 Location update response:', response);
      
      if (response.success) {
        setMessage({ text: "Location updated successfully!", type: "success" });
        await refreshUser();
        setEditMode(prev => ({ ...prev, location: false }));
      } else {
        setMessage({ text: response.message || "Failed to update location", type: "error" });
      }
    } catch (error) {
      console.error("❌ Location update error:", error);
      setMessage({ 
        text: error.response?.data?.message || "An error occurred", 
        type: "error" 
      });
    } finally {
      setLoading(false);
      setLoadingSection(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  const handleSubmitSocial = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingSection('social');
    setMessage({ text: "", type: "" });

    try {
      console.log('📤 Submitting social links:', socialForm);
      
      const filteredSocial = Object.fromEntries(
        Object.entries(socialForm).filter(([_, value]) => value.trim() !== '')
      );
      
      const response = await api.put("/profile/social", filteredSocial);
      console.log('📥 Social links update response:', response);
      
      if (response.success) {
        setMessage({ text: "Social links updated successfully!", type: "success" });
        await refreshUser();
        setEditMode(prev => ({ ...prev, social: false }));
      } else {
        setMessage({ text: response.message || "Failed to update social links", type: "error" });
      }
    } catch (error) {
      console.error("❌ Social links update error:", error);
      setMessage({ 
        text: error.response?.data?.message || "An error occurred", 
        type: "error" 
      });
    } finally {
      setLoading(false);
      setLoadingSection(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  const handleSubmitInterests = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingSection('interests');
    setMessage({ text: "", type: "" });

    try {
      console.log('📤 Submitting interests:', interests);
      const response = await api.put("/profile/interests", { interests });
      console.log('📥 Interests update response:', response);
      
      if (response.success) {
        setMessage({ text: "Interests updated successfully!", type: "success" });
        await refreshUser();
        setEditMode(prev => ({ ...prev, interests: false }));
      } else {
        setMessage({ text: response.message || "Failed to update interests", type: "error" });
      }
    } catch (error) {
      console.error("❌ Interests update error:", error);
      setMessage({ 
        text: error.response?.data?.message || "An error occurred", 
        type: "error" 
      });
    } finally {
      setLoading(false);
      setLoadingSection(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: User, description: "Personal details and contact information" },
    { id: "location", label: "Location", icon: MapPin, description: "Your current location" },
    { id: "social", label: "Social Links", icon: Globe, description: "Connect your social media accounts" },
    { id: "interests", label: "Interests", icon: Heart, description: "Topics you care about" },
  ];

  // Toggle edit mode for a section
  const toggleEditMode = (section) => {
    setEditMode(prev => ({ ...prev, [section]: !prev[section] }));
    setMessage({ text: "", type: "" });
    setErrors({});
  };

  // Cancel edit and reset to original values
  const cancelEdit = (section) => {
    if (user) {
      resetFormToUser(section);
    }
    toggleEditMode(section);
  };

  // Reset form to original user data
  const resetFormToUser = (section) => {
    if (!user) return;
    
    switch(section) {
      case 'basic':
        setBasicForm({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          username: user.username || "",
          phone: user.phone || "",
          alternativePhone: user.alternativePhone || "",
          university: user.university || "",
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
          gender: user.gender || "prefer not to say",
          bio: user.bio || "",
        });
        break;
      case 'location':
        setLocationForm({
          city: user.location?.city || "",
          country: user.location?.country || "",
        });
        break;
      case 'social':
        setSocialForm({
          github: user.socialLinks?.github || "",
          twitter: user.socialLinks?.twitter || "",
          linkedin: user.socialLinks?.linkedin || "",
          instagram: user.socialLinks?.instagram || "",
        });
        break;
      case 'interests':
        setInterests(user.interests || []);
        break;
      default:
        break;
    }
  };

  // SIMPLIFIED: Direct display without complex component
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatGender = (gender) => {
    if (!gender || gender === "prefer not to say") return "Prefer not to say";
    if (gender === "male") return "Male";
    if (gender === "female") return "Female";
    if (gender === "other") return "Other";
    return gender;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your personal information and preferences</p>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200 px-4 sm:px-6 overflow-x-auto">
        <nav className="flex space-x-4 sm:space-x-6 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`group py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap flex flex-col items-center sm:items-start ${
                  activeSubTab === tab.id
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${
                    activeSubTab === tab.id ? "text-teal-600" : "text-gray-400 group-hover:text-gray-600"
                  }`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">
                  {tab.description}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mx-4 sm:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg flex items-center gap-3 animate-slideDown ${
          message.type === "success" 
            ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 shadow-sm" 
            : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200 shadow-sm"
        }`}>
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium flex-1">{message.text}</span>
          <button 
            onClick={() => setMessage({ text: "", type: "" })}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Basic Info Tab */}
      {activeSubTab === "basic" && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Avatar Section - Always Visible */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b border-gray-200">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-xl">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-teal-600" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all shadow-lg cursor-pointer hover:scale-110">
                {isUploading ? (
                  <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
            <div className="text-center sm:text-left flex-1">
              <p className="font-semibold text-gray-900 text-lg sm:text-xl">
                {basicForm.firstName} {basicForm.lastName}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-1 justify-center sm:justify-start">
                <Mail className="w-4 h-4" /> {user?.email}
              </p>
              <p className="text-xs text-gray-500 mt-2 bg-teal-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                <Upload className="w-3 h-3" /> Click camera to change avatar
              </p>
            </div>
          </div>

          {/* Edit Mode Toggle */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => toggleEditMode('basic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                editMode.basic 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {editMode.basic ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Cancel Editing
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmitBasic} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* First Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                {editMode.basic ? (
                  <input
                    type="text"
                    name="firstName"
                    value={basicForm.firstName}
                    onChange={handleBasicChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                      errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="John"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                    {basicForm.firstName || <span className="text-gray-400 italic">Not set</span>}
                  </div>
                )}
                {errors.firstName && editMode.basic && (
                  <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                {editMode.basic ? (
                  <input
                    type="text"
                    name="lastName"
                    value={basicForm.lastName}
                    onChange={handleBasicChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                      errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Doe"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                    {basicForm.lastName || <span className="text-gray-400 italic">Not set</span>}
                  </div>
                )}
                {errors.lastName && editMode.basic && (
                  <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                {editMode.basic ? (
                  <input
                    type="text"
                    name="username"
                    value={basicForm.username}
                    onChange={handleBasicChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                      errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="johndoe_2024"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                    <AtSign className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">
                      {basicForm.username || <span className="text-gray-400 italic">No username</span>}
                    </span>
                  </div>
                )}
                {errors.username && editMode.basic && (
                  <p className="text-xs text-red-600 mt-1">{errors.username}</p>
                )}
              </div>

              {/* Email - Always Read Only */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="flex-1">{user?.email || <span className="text-gray-400 italic">No email</span>}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                {editMode.basic ? (
                  <input
                    type="tel"
                    name="phone"
                    value={basicForm.phone}
                    onChange={handleBasicChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                      errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="+254 712 345 678"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">
                      {basicForm.phone || <span className="text-gray-400 italic">No phone number</span>}
                    </span>
                  </div>
                )}
                {errors.phone && editMode.basic && (
                  <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Alternative Phone */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Alternative Phone
                </label>
                {editMode.basic ? (
                  <input
                    type="tel"
                    name="alternativePhone"
                    value={basicForm.alternativePhone}
                    onChange={handleBasicChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                    placeholder="+254 712 345 679"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">
                      {basicForm.alternativePhone || <span className="text-gray-400 italic">No alternative phone</span>}
                    </span>
                  </div>
                )}
              </div>

              {/* University */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  University
                </label>
                {editMode.basic ? (
                  <input
                    type="text"
                    name="university"
                    value={basicForm.university}
                    onChange={handleBasicChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                      errors.university ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="University of Nairobi"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">
                      {basicForm.university || <span className="text-gray-400 italic">No university</span>}
                    </span>
                  </div>
                )}
                {errors.university && editMode.basic && (
                  <p className="text-xs text-red-600 mt-1">{errors.university}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                {editMode.basic ? (
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={basicForm.dateOfBirth}
                    onChange={handleBasicChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                      errors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">
                      {formatDate(basicForm.dateOfBirth) || <span className="text-gray-400 italic">No date of birth</span>}
                    </span>
                  </div>
                )}
                {errors.dateOfBirth && editMode.basic && (
                  <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth}</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                {editMode.basic ? (
                  <select
                    name="gender"
                    value={basicForm.gender}
                    onChange={handleBasicChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer not to say">Prefer not to say</option>
                  </select>
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">
                      {formatGender(basicForm.gender) || <span className="text-gray-400 italic">Not specified</span>}
                    </span>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                {editMode.basic ? (
                  <>
                    <textarea
                      name="bio"
                      value={basicForm.bio}
                      onChange={handleBasicChange}
                      rows="4"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition resize-none"
                      placeholder="Tell us a little about yourself..."
                    />
                    <p className="text-xs text-gray-500 text-right">{basicForm.bio.length}/500</p>
                  </>
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 min-h-[100px]">
                    {basicForm.bio || <span className="text-gray-400 italic">No bio provided</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Only show in edit mode */}
            {editMode.basic && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => cancelEdit('basic')}
                  className="px-4 sm:px-6 py-2.5 sm:py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading && loadingSection === 'basic'}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading && loadingSection === 'basic' ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Location Tab */}
      {activeSubTab === "location" && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-100">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              Tell us where you're located to connect with local students
            </p>
          </div>

          {/* Edit Mode Toggle */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => toggleEditMode('location')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                editMode.location 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {editMode.location ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Cancel Editing
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Edit Location
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleSubmitLocation} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* City */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                {editMode.location ? (
                  <input
                    type="text"
                    name="city"
                    value={locationForm.city}
                    onChange={handleLocationChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                    placeholder="e.g., Nairobi"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">
                      {locationForm.city || <span className="text-gray-400 italic">No city</span>}
                    </span>
                  </div>
                )}
              </div>

              {/* Country */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                {editMode.location ? (
                  <input
                    type="text"
                    name="country"
                    value={locationForm.country}
                    onChange={handleLocationChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                    placeholder="e.g., Kenya"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">
                      {locationForm.country || <span className="text-gray-400 italic">No country</span>}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Only show in edit mode */}
            {editMode.location && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => cancelEdit('location')}
                  className="px-4 sm:px-6 py-2.5 sm:py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading && loadingSection === 'location'}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading && loadingSection === 'location' ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Location
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Social Links Tab - Simplified similarly */}
      {activeSubTab === "social" && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-600" />
              Connect your social media to build your network
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => toggleEditMode('social')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                editMode.social 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {editMode.social ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Cancel Editing
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Edit Social Links
                </>
              )}
            </button>
          </div>

          {editMode.social ? (
            <form onSubmit={handleSubmitSocial} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">GitHub Profile</label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    name="github"
                    value={socialForm.github}
                    onChange={handleSocialChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Twitter Profile</label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    name="twitter"
                    value={socialForm.twitter}
                    onChange={handleSocialChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                    placeholder="https://twitter.com/username"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">LinkedIn Profile</label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    name="linkedin"
                    value={socialForm.linkedin}
                    onChange={handleSocialChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Instagram Profile</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    name="instagram"
                    value={socialForm.instagram}
                    onChange={handleSocialChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                    placeholder="https://instagram.com/username"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => cancelEdit('social')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save</button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Github, value: socialForm.github, label: "GitHub", placeholder: "No GitHub link" },
                { icon: Twitter, value: socialForm.twitter, label: "Twitter", placeholder: "No Twitter link" },
                { icon: Linkedin, value: socialForm.linkedin, label: "LinkedIn", placeholder: "No LinkedIn link" },
                { icon: Instagram, value: socialForm.instagram, label: "Instagram", placeholder: "No Instagram link" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="p-2 bg-white rounded-lg">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    {item.value ? (
                      <a href={item.value} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:underline truncate block">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400 italic">{item.placeholder}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interests Tab - Simplified similarly */}
      {activeSubTab === "interests" && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-100">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Heart className="w-5 h-5 text-orange-600" />
              Add interests to discover relevant content
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => toggleEditMode('interests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                editMode.interests 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {editMode.interests ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Cancel Editing
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Edit Interests
                </>
              )}
            </button>
          </div>

          {editMode.interests ? (
            <form onSubmit={handleSubmitInterests} className="space-y-4">
              {/* Add interest input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add New Interest</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g., Technology"
                  />
                  <button type="button" onClick={addInterest} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    Add
                  </button>
                </div>
              </div>

              {/* Display interests */}
              {interests.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <span key={interest} onClick={() => removeInterest(interest)} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm cursor-pointer hover:bg-teal-100">
                        {interest} <X className="w-3 h-3 inline ml-1" />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => cancelEdit('interests')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save</button>
              </div>
            </form>
          ) : (
            <div>
              {interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span key={interest} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 italic">
                  No interests added yet
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}