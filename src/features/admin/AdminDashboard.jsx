import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api.js';
import { setAlert } from '../../redux/uiSlice.js';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import QueryStatsIcon from '@mui/icons-material/QueryStats';

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
    <div className="min-h-screen bg-tg-bgDark text-tg-textDefault p-4 sm:p-8 overflow-y-auto tg-chat-bg text-left relative">
      {/* Decorative premium blurs */}
      <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] bg-tg-blue/10 blur-[150px] rounded-full pointer-events-none" />
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8 border-b border-tg-borderDark/60 pb-5 relative z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 py-1.5 px-3 rounded-xl bg-tg-bgSidebarDark/80 hover:bg-tg-bgDark border border-tg-borderDark/60 text-tg-blue transition shadow-md flex items-center gap-1.5 text-xs font-bold">
            <ArrowBackIcon fontSize="inherit" style={{ fontSize: '13px' }} />
            Exit Console
          </Link>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <SupervisorAccountIcon className="text-tg-blue" />
              Office Security & Operations Console
            </h2>
            <p className="text-[10px] text-tg-textMuted mt-0.5 font-medium uppercase tracking-wider">Admin Management System</p>
          </div>
        </div>

        <button
          onClick={loadAdminData}
          className="px-4.5 py-2.5 bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue border border-tg-blue/20 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
        >
          Refresh Statistics
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 relative z-10">
        {[
          { title: 'Total Verified Users', value: stats.totalUsers, desc: `${stats.onlineUsers} users currently online`, color: 'text-green-400' },
          { title: 'Communication Hubs', value: stats.totalGroups + stats.totalChannels, desc: `${stats.totalGroups} groups • ${stats.totalChannels} channels`, color: 'text-tg-textMuted' },
          { title: 'Internal Messages Logged', value: stats.totalMessages, desc: `${stats.totalFiles} secure files shared`, color: 'text-tg-textMuted' },
          { title: 'Integrated Bot Usage', value: stats.totalBotUsage, desc: 'Active request actions dispatched', color: 'text-tg-textMuted' }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="bg-tg-bgSidebarDark/60 backdrop-blur-md border border-tg-borderDark/60 p-5 rounded-2xl shadow-sm"
          >
            <span className="text-[10px] uppercase font-bold text-tg-textMuted block tracking-wider">{item.title}</span>
            <span className="text-3xl font-extrabold text-tg-textDefault mt-2.5 block tracking-tight">{item.value}</span>
            <span className={`text-[9px] font-semibold mt-1.5 block ${item.color}`}>{item.desc}</span>
          </motion.div>
        ))}
      </div>

      {/* Main split details view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* User Accounts Management */}
        <div className="lg:col-span-2 bg-tg-bgSidebarDark/45 backdrop-blur-md border border-tg-borderDark/60 rounded-3xl p-6 flex flex-col h-[550px] shadow-sm">
          <h3 className="text-xs font-bold text-tg-textDefault uppercase tracking-wider mb-4">Corporate Accounts List</h3>
          
          <div className="flex-grow overflow-auto border border-tg-borderDark/60 rounded-2xl bg-tg-bgDark/30 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-tg-borderDark/60 text-tg-textMuted uppercase font-bold text-[9px] bg-tg-bgDark/45 sticky top-0 z-10">
                  <th className="p-3.5">User Details</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-tg-borderDark/30 hover:bg-tg-bgDark/30 transition">
                    <td className="p-3.5">
                      <div>
                        <span className="font-semibold block text-tg-textDefault">{u.firstName} {u.lastName}</span>
                        <span className="text-[10px] text-tg-textMuted mt-0.5 block font-mono">
                          @{u.username} • {u.department}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 capitalize font-medium text-tg-textMuted">{u.role}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${u.status === 'active' ? 'bg-green-500/10 text-green-400' : u.status === 'suspended' ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {u.role !== 'admin' && (
                        <>
                          {u.status !== 'active' && (
                            <button
                              onClick={() => handleUpdateStatus(u._id, 'active')}
                              className="px-2 py-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/25 text-green-400 rounded-lg text-[9px] font-bold transition cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                          {u.status !== 'suspended' && (
                            <button
                              onClick={() => handleUpdateStatus(u._id, 'suspended')}
                              className="px-2 py-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-orange-400 rounded-lg text-[9px] font-bold transition cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                          {u.status !== 'banned' && (
                            <button
                              onClick={() => handleUpdateStatus(u._id, 'banned')}
                              className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 rounded-lg text-[9px] font-bold transition cursor-pointer"
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
                        className="px-2 py-1 bg-tg-bgDark hover:bg-tg-bgDark/60 border border-tg-borderDark/60 text-tg-textDefault rounded-lg text-[9px] font-bold transition cursor-pointer"
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
        <div className="bg-tg-bgSidebarDark/45 backdrop-blur-md border border-tg-borderDark/60 rounded-3xl p-6 flex flex-col h-[550px] shadow-sm">
          <h3 className="text-xs font-bold text-tg-textDefault uppercase tracking-wider mb-4 flex items-center gap-2">
            <QueryStatsIcon className="text-tg-blue" />
            Security Audit Trail
          </h3>

          <div className="flex-grow overflow-y-auto space-y-3 bg-tg-bgDark/30 border border-tg-borderDark/60 rounded-2xl p-4 shadow-inner">
            {logs.map((log, lIdx) => (
              <div key={log._id || lIdx} className="text-left border-b border-tg-borderDark/30 pb-2.5 text-[11px] leading-relaxed">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-tg-blue">{log.action}</span>
                  <span className="text-[9px] text-tg-textMuted font-medium">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-tg-textDefault font-medium">
                  User: <strong className="text-tg-blue">@{log.user?.username || 'GUEST'}</strong> • IP: {log.ipAddress || 'local'}
                </p>
                {log.details && (
                  <p className="text-[10px] text-tg-textMuted mt-0.5 font-mono bg-black/10 p-1 rounded">
                    Details: {JSON.stringify(log.details)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RESET PASSWORD MODAL */}
      <AnimatePresence>
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-tg-bgSidebarDark border border-tg-borderDark/60 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h4 className="text-xs font-bold text-tg-textDefault mb-4">
                Reset Password for @{selectedUser.username}
              </h4>
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-3.5 py-2 bg-tg-bgDark hover:bg-tg-bgDark/60 border border-tg-borderDark/60 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-tg-blue hover:bg-tg-darkBlue text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-tg-blue/15"
                  >
                    Confirm Reset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
