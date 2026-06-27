import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { setAlert } from '../../redux/uiSlice.js';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';

export const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      dispatch(setAlert({ message: 'Access denied. Administrator privileges required.', severity: 'error' }));
      navigate('/');
    }
  }, [user, navigate, dispatch]);

  const loadAdminData = async () => {
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);

      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data);

      const logsRes = await api.get('/admin/logs');
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateStatus = async (userId, status) => {
    try {
      await api.put(`/admin/user/${userId}/status`, { status });
      dispatch(setAlert({ message: `User status changed to ${status} successfully`, severity: 'success' }));
      loadAdminData(); // Reload list
    } catch (err) {
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to update status', severity: 'error' }));
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    try {
      await api.put(`/admin/user/${selectedUser._id}/reset-password`, { newPassword });
      dispatch(setAlert({ message: `Password reset successfully for ${selectedUser.username}`, severity: 'success' }));
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err) {
      dispatch(setAlert({ message: 'Failed to reset password', severity: 'error' }));
    }
  };

  if (!stats) return <div className="text-white p-10">Loading admin operations console...</div>;

  return (
    <div className="min-h-screen bg-tg-bgDark text-white p-4 sm:p-8 overflow-y-auto tg-chat-bg">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8 border-b border-gray-800 pb-5">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-tg-blue transition">
            <ArrowBackIcon fontSize="small" />
          </Link>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <SupervisorAccountIcon className="text-tg-blue" />
              Office Security & Operations Console
            </h2>
            <p className="text-[10px] text-tg-textMuted mt-0.5">Admin Management System</p>
          </div>
        </div>

        <button
          onClick={loadAdminData}
          className="px-4 py-2 bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue border border-tg-blue/20 rounded-xl text-xs font-semibold transition"
        >
          Refresh Statistics
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-tg-bgSidebarDark/80 border border-gray-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-tg-textMuted block">Total Verified Users</span>
          <span className="text-2xl font-bold text-white mt-1 block">{stats.totalUsers}</span>
          <span className="text-[9px] text-green-400 mt-1 block">{stats.onlineUsers} users currently online</span>
        </div>

        <div className="bg-tg-bgSidebarDark/80 border border-gray-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-tg-textMuted block">Communication Hubs</span>
          <span className="text-2xl font-bold text-white mt-1 block">{stats.totalGroups + stats.totalChannels}</span>
          <span className="text-[9px] text-tg-textMuted mt-1 block">
            {stats.totalGroups} groups • {stats.totalChannels} channels
          </span>
        </div>

        <div className="bg-tg-bgSidebarDark/80 border border-gray-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-tg-textMuted block">Internal Messages Logged</span>
          <span className="text-2xl font-bold text-white mt-1 block">{stats.totalMessages}</span>
          <span className="text-[9px] text-tg-textMuted mt-1 block">{stats.totalFiles} secure files shared</span>
        </div>

        <div className="bg-tg-bgSidebarDark/80 border border-gray-800 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-tg-textMuted block">Integrated Bot Usage</span>
          <span className="text-2xl font-bold text-white mt-1 block">{stats.totalBotUsage}</span>
          <span className="text-[9px] text-tg-textMuted mt-1 block">Active request actions dispatched</span>
        </div>
      </div>

      {/* Main split details view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Accounts Management */}
        <div className="lg:col-span-2 bg-tg-bgSidebarDark/50 border border-gray-800 rounded-2xl p-6 flex flex-col h-[550px]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Corporate Accounts List</h3>
          
          <div className="flex-grow overflow-auto border border-gray-850 rounded-xl bg-gray-900/30">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-tg-textMuted uppercase font-bold text-[9px] bg-tg-bgDark/30">
                  <th className="p-3">User Details</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-gray-850 hover:bg-gray-800/20">
                    <td className="p-3">
                      <div>
                        <span className="font-semibold block text-white">{u.firstName} {u.lastName}</span>
                        <span className="text-[10px] text-tg-textMuted mt-0.5 block">
                          @{u.username} • {u.department}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 capitalize">{u.role}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${u.status === 'active' ? 'bg-green-500/10 text-green-400' : u.status === 'suspended' ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {u.role !== 'admin' && (
                        <>
                          {u.status !== 'active' && (
                            <button
                              onClick={() => handleUpdateStatus(u._id, 'active')}
                              className="px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded text-[10px] transition"
                            >
                              Activate
                            </button>
                          )}
                          {u.status !== 'suspended' && (
                            <button
                              onClick={() => handleUpdateStatus(u._id, 'suspended')}
                              className="px-2 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded text-[10px] transition"
                            >
                              Suspend
                            </button>
                          )}
                          {u.status !== 'banned' && (
                            <button
                              onClick={() => handleUpdateStatus(u._id, 'banned')}
                              className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] transition"
                            >
                              Ban
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setShowPasswordModal(true);
                        }}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-[10px] transition"
                      >
                        Reset PW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs streams */}
        <div className="bg-tg-bgSidebarDark/50 border border-gray-800 rounded-2xl p-6 flex flex-col h-[550px]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <QueryStatsIcon className="text-tg-blue" />
            Security Audit Trail
          </h3>

          <div className="flex-grow overflow-y-auto space-y-3 bg-gray-900/30 border border-gray-850 rounded-xl p-4">
            {logs.map((log, lIdx) => (
              <div key={log._id || lIdx} className="text-left border-b border-gray-850 pb-2 text-[11px] leading-relaxed">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-green-400">{log.action}</span>
                  <span className="text-[9px] text-tg-textMuted">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-300">
                  User: <strong>{log.user?.username || 'GUEST'}</strong> • IP: {log.ipAddress || 'local'}
                </p>
                {log.details && (
                  <p className="text-[10px] text-tg-textMuted mt-0.5">
                    Details: {JSON.stringify(log.details)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RESET PASSWORD MODAL */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-tg-bgSidebarDark border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h4 className="text-sm font-bold text-white mb-4">
              Reset Password for @{selectedUser.username}
            </h4>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-tg-blue hover:bg-tg-darkBlue text-white rounded text-xs transition"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
