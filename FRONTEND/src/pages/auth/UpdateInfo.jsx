import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiUser, FiPhone, FiSave, FiArrowLeft, } from "react-icons/fi";
import logo from "../../assets/uni_logo.png";

const universities = [
  "Chuka University",
  "Meru University of Science and Technology",
  "Embu University",
  "Maseno University",
  "University of Nairobi",
  "Moi University",
  "Egerton University",
  "Kenyatta University",
  "Jomo Kenyatta University of Agriculture and Technology",
  "Tom Mboya University",
  "Kisii University",
  "Laikipia University",
  "Rongo University",
  "Karatina University",
  "Machakos University",
  "South Eastern Kenya University",
  "Pwani University",
  "Technical University of Kenya",
  "Masinde Muliro University of Science and Technology",
  "University of Eldoret",
  "Dedan Kimathi University of Technology",
  "Taita Taveta University",
  "Garissa University",
  "Alupe University",
  "Murang'a University of Technology",
];

export default function UpdateInfo() {
  const { user, updateUserProfile, completeGoogleProfile } = useAuth(); // ✅ Added completeGoogleProfile
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    university: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Pre-fill form with existing user data
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        university: user.university || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { firstName, lastName, phone, university } = form;

    if (!firstName.trim()) {
      setMessage({ text: "Please enter your first name", type: "error" });
      return false;
    }

    if (!lastName.trim()) {
      setMessage({ text: "Please enter your last name", type: "error" });
      return false;
    }

    if (!phone.trim()) {
      setMessage({ text: "Please enter your phone number", type: "error" });
      return false;
    }

    if (!/^\+?[\d\s-()]{10,}$/.test(phone)) {
      setMessage({ text: "Please enter a valid phone number", type: "error" });
      return false;
    }

    if (!university) {
      setMessage({ text: "Please select your university", type: "error" });
      return false;
    }

    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Check if this is a Google OAuth user completing profile
      const urlParams = new URLSearchParams(window.location.search);
      const tempToken = urlParams.get('token');
      const isNewUser = urlParams.get('newUser');


      if (tempToken && isNewUser) {
        // Google OAuth user completing profile
        await completeGoogleProfile({
          ...form,
          tempToken
        });
        
        setMessage({ 
          text: "Profile completed successfully! Redirecting...", 
          type: "success" 
        });
        
        setTimeout(() => navigate("/"), 2000);
      } else {
        // Regular profile update
        await updateUserProfile(form);
        setMessage({ 
          text: "Profile updated successfully! Redirecting...", 
          type: "success" 
        });
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (error) {
      console.error("UpdateInfo error:", error); // Debug log
      setMessage({ 
        text: error.response?.data?.message || error.message || "Failed to update profile", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const { firstName, lastName, phone, university } = form;
    return firstName && lastName && phone && university;
  };

  // Check if this is a new Google OAuth user
  const urlParams = new URLSearchParams(window.location.search);
  const isNewGoogleUser = urlParams.get('newUser') === 'true';
  const tempToken = urlParams.get('token');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-100 px-4 py-8">
      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-md border border-teal-100">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-teal-100 p-3 rounded-2xl mb-3">
            <img src={logo} alt="UniMarket Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            UniMarket
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {isNewGoogleUser ? "Complete Your Profile" : "Update Your Profile"}
          </p>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
          {isNewGoogleUser ? "Almost There! 🎉" : "Update Profile"}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {isNewGoogleUser 
            ? "Please complete your profile to start using UniMarket"
            : "Update your profile information below"
          }
        </p>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800">
              <strong>Debug:</strong> isNewGoogleUser: {isNewGoogleUser ? 'true' : 'false'}, 
              tempToken: {tempToken ? 'present' : 'missing'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                  required
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phone"
                placeholder="+254 XXX XXX XXX"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Format: +254 XXX XXX XXX
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              University
            </label>
            <div className="relative">
              <select
                name="university"
                value={form.university}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition appearance-none bg-white"
                required
              >
                <option value="">Select Your University</option>
                {universities.map((uni, idx) => (
                  <option key={idx} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {message.text && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                message.type === "success" 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              loading || !isFormValid()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isNewGoogleUser ? "Completing Profile..." : "Updating Profile..."}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <FiSave className="text-lg" />
                {isNewGoogleUser ? "Complete Profile" : "Update Profile"}
              </div>
            )}
          </button>

          {isNewGoogleUser && (
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <FiArrowLeft className="text-lg" />
              Skip for Now
            </button>
          )}
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            This information helps us connect you with students from your university
          </p>
        </div>
      </div>
    </div>
  );
}