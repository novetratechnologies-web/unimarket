// src/pages/auth/CompleteProfile.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api";
import { User, Phone, Building2, Save } from "lucide-react";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    university: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Get user data from location state or URL params
    const params = new URLSearchParams(location.search);
    const token = params.get('token') || location.state?.token;
    const refresh = params.get('refresh') || location.state?.refresh;
    const userData = location.state?.user;

    console.log('🔍 CompleteProfile loaded:', { token, refresh, userData });

    if (userData) {
      setForm(prev => ({
        ...prev,
        firstName: userData.firstName || '',
        lastName: userData.lastName || ''
      }));
    }

    // Store tokens if provided
    if (token && refresh) {
      sessionStorage.setItem('authTokens', JSON.stringify({
        access: token,
        refresh: refresh,
        storedAt: Date.now()
      }));
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Get token from sessionStorage
      const tokens = JSON.parse(sessionStorage.getItem('authTokens') || '{}');
      
      const response = await api.post('/auth/complete-google-profile', form, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`
        }
      });

      if (response.success) {
        // Update stored user data
        sessionStorage.setItem('userData', JSON.stringify(response.data.user));
        
        // Redirect to dashboard
        navigate('/dashboard', { 
          state: { message: 'Profile completed successfully!' }
        });
      } else {
        setMessage(response.message || 'Failed to complete profile');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      setMessage(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Complete Your Profile
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Just a few more details to get started
        </p>

        {message && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                placeholder="John"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                placeholder="+254 712 345 678"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              University
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="university"
                value={form.university}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                placeholder="e.g., University of Nairobi"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Complete Profile
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}