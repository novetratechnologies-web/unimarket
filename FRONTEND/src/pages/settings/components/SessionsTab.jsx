// src/pages/settings/components/SessionsTab.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../api";
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  Globe,
  Trash2,
  AlertCircle,
  LogOut,
  CheckCircle,
  X,
  Loader,
  Monitor,
  Clock
} from "lucide-react";

export default function SessionsTab() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState(null);
  const [terminatingAll, setTerminatingAll] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // GET /api/profile/sessions - Get all active sessions
      const response = await api.get("/profile/sessions");
      console.log("📥 Sessions response:", response);
      
      if (response?.success) {
        // Filter out current session and set others
        const allSessions = response.sessions || [];
        setSessions(allSessions);
        
        // The current session info might be in the response
        if (response.currentSession) {
          setCurrentSession({
            id: 'current',
            device: getDeviceInfo(response.currentSession),
            browser: getBrowserInfo(response.currentSession),
            ip: response.currentIP || '127.0.0.1',
            lastActive: new Date().toISOString(),
            isCurrent: true
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setMessage({ 
        text: error.message || "Failed to load sessions", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get device info from user agent
  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return "Unknown Device";
    
    if (userAgent.includes("Windows")) return "Windows PC";
    if (userAgent.includes("Mac")) return "Mac";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("iPad")) return "iPad";
    if (userAgent.includes("Android")) return "Android Device";
    return "Unknown Device";
  };

  // Helper to get browser info from user agent
  const getBrowserInfo = (userAgent) => {
    if (!userAgent) return "Unknown Browser";
    
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
    if (userAgent.includes("Edg")) return "Edge";
    if (userAgent.includes("MSIE") || userAgent.includes("Trident")) return "Internet Explorer";
    return "Unknown Browser";
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <Monitor className="w-5 h-5" />;
    
    if (userAgent.includes("Mobile") || userAgent.includes("iPhone") || userAgent.includes("Android")) 
      return <Smartphone className="w-5 h-5" />;
    if (userAgent.includes("Tablet") || userAgent.includes("iPad")) 
      return <Tablet className="w-5 h-5" />;
    return <Laptop className="w-5 h-5" />;
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return "Unknown";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleTerminateSession = async (sessionId) => {
    if (!confirm("Are you sure you want to terminate this session? The user will be logged out.")) return;
    
    setTerminatingId(sessionId);
    setMessage({ text: "", type: "" });
    
    try {
      // DELETE /api/profile/sessions/:sessionId - Terminate specific session
      const response = await api.delete(`/profile/sessions/${sessionId}`);
      
      console.log("📥 Terminate response:", response);
      
      if (response?.success) {
        setSessions(sessions.filter(s => s._id !== sessionId));
        setMessage({ 
          text: "Session terminated successfully", 
          type: "success" 
        });
      } else {
        throw new Error(response?.message || "Failed to terminate session");
      }
    } catch (error) {
      console.error("Failed to terminate session:", error);
      setMessage({ 
        text: error.message || "Failed to terminate session", 
        type: "error" 
      });
    } finally {
      setTerminatingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  const handleTerminateAll = async () => {
    if (!confirm("⚠️ This will log you out of all other devices. You will stay logged in on this device. Continue?")) return;
    
    setTerminatingAll(true);
    setMessage({ text: "", type: "" });
    
    try {
      // POST /api/profile/sessions/terminate-all - Terminate all sessions
      const response = await api.post("/profile/sessions/terminate-all");
      
      console.log("📥 Terminate all response:", response);
      
      if (response?.success) {
        setSessions([]); // Clear all other sessions
        setMessage({ 
          text: "All other sessions terminated successfully", 
          type: "success" 
        });
      } else {
        throw new Error(response?.message || "Failed to terminate sessions");
      }
    } catch (error) {
      console.error("Failed to terminate all sessions:", error);
      setMessage({ 
        text: error.message || "Failed to terminate sessions", 
        type: "error" 
      });
    } finally {
      setTerminatingAll(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader className="w-8 h-8 text-teal-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading your active sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Active Sessions</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage devices where you're currently logged in
        </p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mx-6 mt-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : "bg-red-50 text-red-700 border border-red-200"
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

      {/* Sessions List */}
      <div className="p-6 space-y-4">
        {/* Current Session */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Current Session</p>
              <p className="text-sm text-gray-600">
                {getBrowserInfo(navigator.userAgent)} on {getDeviceInfo(navigator.userAgent)}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                <span>Last active: Just now</span>
              </div>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            Current
          </span>
        </div>

        {/* Other Sessions */}
        {sessions.length > 0 ? (
          sessions.map((session) => {
            const sessionId = session._id || session.id;
            const userAgent = session.deviceInfo || session.userAgent || '';
            const isTerminating = terminatingId === sessionId;
            
            return (
              <div 
                key={sessionId} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center group-hover:bg-gray-300 transition">
                    {getDeviceIcon(userAgent)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {getDeviceInfo(userAgent)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getBrowserInfo(userAgent)} • IP: {session.ipAddress || session.ip || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>Last active: {formatLastActive(session.lastActive || session.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleTerminateSession(sessionId)}
                  disabled={isTerminating}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Terminate session"
                >
                  {isTerminating ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No other active sessions</p>
            <p className="text-sm text-gray-500 mt-1">
              You're only logged in on this device
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {sessions.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleTerminateAll}
            disabled={terminatingAll}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {terminatingAll ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Log out all other devices
          </button>
          <p className="text-xs text-gray-500 mt-2">
            This will immediately log you out from all other devices. You'll stay logged in on this device.
          </p>
        </div>
      )}
    </div>
  );
}