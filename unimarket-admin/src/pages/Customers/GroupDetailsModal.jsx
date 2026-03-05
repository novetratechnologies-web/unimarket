// admin/src/pages/Customers/GroupDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Edit,
  Trash2,
  Mail,
  Download,
  UserPlus,
  UserMinus,
  RefreshCw,
  Tag,
  Clock,
  Calendar,
  Filter,
  Settings,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

const GroupDetailsModal = ({ group, onClose, onEdit }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    verifiedMembers: 0,
    averageSpent: 0,
    totalSpent: 0
  });
  const { showToast } = useToast();

  useEffect(() => {
    if (group?._id) {
      fetchGroupDetails();
    }
  }, [group]);

  const fetchGroupDetails = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [membersRes, statsRes] = await Promise.all([
        api.get(`/admin/customer-groups/${group._id}/members`, { params: { limit: 10 } }),
        api.get(`/admin/customer-groups/${group._id}/stats`)
      ]);

      if (membersRes?.success) {
        setMembers(membersRes.data || []);
      }
      if (statsRes?.success) {
        setStats(statsRes.data || {});
      }
    } catch (error) {
      console.error('Failed to fetch group details:', error);
      showToast(error.message || 'Failed to load group details', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'dynamic': return <Filter className="h-5 w-5" />;
      case 'static': return <Users className="h-5 w-5" />;
      case 'auto': return <RefreshCw className="h-5 w-5" />;
      default: return <Tag className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'dynamic': return 'bg-purple-100 text-purple-700';
      case 'static': return 'bg-blue-100 text-blue-700';
      case 'auto': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const InfoCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-primary-600 to-blue-600">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-xl bg-white/20 backdrop-blur-sm`}>
                {getTypeIcon(group?.type)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{group?.name}</h2>
                <p className="text-white/80 mt-1">{group?.description || 'No description'}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className={`text-sm px-3 py-1 rounded-full ${getTypeColor(group?.type)}`}>
                  {group?.type?.charAt(0).toUpperCase() + group?.type?.slice(1) || 'Static'}
                </span>
                {group?.isActive ? (
                  <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    Inactive
                  </span>
                )}
                <span className="text-sm text-gray-600 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Created {group?.createdAt ? format(new Date(group.createdAt), 'MMM d, yyyy') : 'N/A'}
                </span>
              </div>
              <button
                onClick={() => fetchGroupDetails(true)}
                disabled={refreshing}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              {['overview', 'members', 'rules', 'activity'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoCard
                    title="Total Members"
                    value={stats.totalMembers?.toLocaleString() || '0'}
                    icon={Users}
                    color="bg-blue-600"
                  />
                  <InfoCard
                    title="Active Members"
                    value={stats.activeMembers?.toLocaleString() || '0'}
                    icon={CheckCircle}
                    color="bg-green-600"
                  />
                  <InfoCard
                    title="Verified"
                    value={stats.verifiedMembers?.toLocaleString() || '0'}
                    icon={CheckCircle}
                    color="bg-purple-600"
                  />
                  <InfoCard
                    title="Total Spent"
                    value={`KES ${(stats.totalSpent || 0).toLocaleString()}`}
                    icon={Tag}
                    color="bg-amber-600"
                  />
                </div>

                {/* Tags */}
                {group?.tags && group.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Settings */}
                {group?.settings && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Settings</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {group.settings.autoUpdate && (
                        <p className="text-sm text-gray-600">
                          Auto-updates {group.settings.updateFrequency || 'daily'}
                        </p>
                      )}
                      {group.settings.notifyOnChange && (
                        <p className="text-sm text-gray-600">Notifications enabled</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {group.settings.allowDuplicates 
                          ? 'Customers can be in multiple groups'
                          : 'Customers are unique to this group'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Recent Members</h4>
                  <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No members in this group yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member, index) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-semibold">
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {member.status}
                          </span>
                          <button className="p-1 hover:bg-gray-200 rounded-lg">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rules' && (
              <div>
                {group?.type === 'dynamic' ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700">
                        Match {group.conditions?.matchType === 'all' ? 'ALL' : 'ANY'} of the following rules:
                      </p>
                    </div>
                    {group.conditions?.rules?.map((rule, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{rule.field}:</span>{' '}
                          {rule.operator} {rule.value}
                          {rule.min && rule.max && ` between ${rule.min} and ${rule.max}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Filter className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      This is a {group?.type} group. Members are managed manually.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Log</h3>
                <p className="text-gray-600">Coming soon...</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Add Members">
                <UserPlus className="h-4 w-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Remove Members">
                <UserMinus className="h-4 w-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Email Group">
                <Mail className="h-4 w-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Export">
                <Download className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Edit Group
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal;