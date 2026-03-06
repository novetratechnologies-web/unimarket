import { useState } from "react";
import { api } from "../../../api";
import { useAuth } from "../../../context/AuthContext";
import { 
  Trash2, 
  AlertTriangle,
  LogOut,
  Shield,
  X
} from "lucide-react";

export default function DangerZone() {
  const { logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") return;
    
    setLoading(true);
    try {
      await api.delete("/auth/account");
      await logout();
    } catch (error) {
      console.error("Failed to delete account:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-red-200">
        <div className="p-6 border-b border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
          <p className="text-sm text-red-600 mt-1">
            Irreversible actions that affect your account
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Logout All Devices */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Log out all devices</p>
                <p className="text-sm text-gray-600">
                  Sign out from all active sessions
                </p>
              </div>
            </div>
            <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
              Log out all
            </button>
          </div>

          {/* Deactivate Account */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Deactivate account</p>
                <p className="text-sm text-gray-600">
                  Temporarily disable your account
                </p>
              </div>
            </div>
            <button className="px-4 py-2 text-yellow-600 border border-yellow-200 rounded-lg hover:bg-yellow-50 transition">
              Deactivate
            </button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Delete account</p>
                <p className="text-sm text-red-600">
                  Permanently delete your account and all data
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Delete Account</h3>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                This action is <span className="font-bold text-red-600">permanent</span> and cannot be undone. 
                All your data, listings, and account information will be permanently deleted.
              </p>

              <p className="text-sm text-gray-600 mb-4">
                Type <span className="font-mono font-bold bg-gray-100 px-2 py-1 rounded">DELETE</span> to confirm:
              </p>

              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition mb-4"
                placeholder="DELETE"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteText !== "DELETE" || loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}