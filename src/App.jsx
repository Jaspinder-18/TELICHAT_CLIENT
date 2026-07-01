import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearAlert, setAlert, clearInAppNotification } from './redux/uiSlice.js';
import { setActiveChat } from './redux/chatSlice.js';
import api, { getFileUrl } from './services/api.js';

// MUI components
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';

// Framer motion
import { motion, AnimatePresence } from 'framer-motion';

// Auth Components
import Login from './features/auth/Login.jsx';
import Register from './features/auth/Register.jsx';
import ForgotPassword from './features/auth/ForgotPassword.jsx';

// Core Dashboard Components
import Sidebar from './features/dashboard/Sidebar.jsx';
import ChatWindow from './features/dashboard/ChatWindow.jsx';
import RightPanel from './features/dashboard/RightPanel.jsx';
import TaskDashboard from './features/dashboard/TaskDashboard.jsx';
import ApprovalCenter from './features/dashboard/ApprovalCenter.jsx';
import WorkflowBuilder from './features/dashboard/WorkflowBuilder.jsx';
import ProductivityPanel from './features/dashboard/ProductivityPanel.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import AIAssistantDrawer from './components/AIAssistantDrawer.jsx';
import { setLeftSidebarTab, setAiDrawerOpen } from './redux/uiSlice.js';
import SmartToyIcon from '@mui/icons-material/SmartToy';

// Admin panel component
import AdminDashboard from './features/admin/AdminDashboard.jsx';

// Socket Context wrapper
import { SocketProvider } from './context/SocketContext.jsx';

// Route guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const MainDashboardLayout = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeChat, activeChatType, contacts, myGroups } = useSelector((state) => state.chat);
  const { leftSidebarTab, rightSidebarOpen, aiDrawerOpen } = useSelector((state) => state.ui);

  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  // Monitor Ctrl+K / Cmd+K global shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderMainContent = () => {
    switch (leftSidebarTab) {
      case 'tasks':
        return <TaskDashboard user={user} />;
      case 'approvals':
        return <ApprovalCenter user={user} contacts={contacts} />;
      case 'workflows':
        return <WorkflowBuilder user={user} />;
      case 'productivity':
        return <ProductivityPanel user={user} />;
      default:
        return <ChatWindow />;
    }
  };

  return (
    <SocketProvider>
      <div className="h-screen w-screen flex bg-tg-bgDark overflow-hidden relative">
        {/* Left pane containing sidebar */}
        <div className={`h-full w-full md:w-[320px] flex-shrink-0 ${activeChat && leftSidebarTab === 'chats' ? 'hidden md:block' : 'block'}`}>
          <Sidebar />
        </div>
        
        {/* Central main view */}
        <div className={`h-full flex-grow ${activeChat && leftSidebarTab === 'chats' ? 'block' : 'hidden md:block'}`}>
          {renderMainContent()}
        </div>
        
        {/* Optional Right panel for info gallery */}
        {leftSidebarTab === 'chats' && (
          <div className="h-full z-30 flex-shrink-0 absolute right-0 md:relative">
            <RightPanel />
          </div>
        )}

        {/* Command Palette Overlay */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onSelectAction={(item) => {
            if (item.id === 'goto_tasks') dispatch(setLeftSidebarTab('tasks'));
            else if (item.id === 'goto_approvals') dispatch(setLeftSidebarTab('approvals'));
            else if (item.id === 'goto_workflow') dispatch(setLeftSidebarTab('workflows'));
            else if (item.id === 'ai_translate_tool') dispatch(setAiDrawerOpen(true));
            else if (item.id.startsWith('contact_')) {
              dispatch(setActiveChat({ chat: item.data, type: 'user' }));
              dispatch(setLeftSidebarTab('chats'));
            }
            else if (item.id.startsWith('group_')) {
              dispatch(setActiveChat({ chat: item.data, type: 'group' }));
              dispatch(setLeftSidebarTab('chats'));
            }
          }}
          contacts={contacts}
          groups={myGroups}
        />

        {/* AI Assistant Drawer */}
        <AIAssistantDrawer
          isOpen={aiDrawerOpen}
          onClose={() => dispatch(setAiDrawerOpen(false))}
          activeChat={activeChat}
          activeChatType={activeChatType}
        />

        {/* Floating admin link if user is administrator */}
        {user?.role === 'admin' && (
          <div className="absolute bottom-4 left-[340px] z-40">
            <NavigateButton />
          </div>
        )}
      </div>
    </SocketProvider>
  );
};

const NavigateButton = () => {
  const { rightSidebarOpen } = useSelector((state) => state.ui);
  // Avoid overlapping right panel
  return (
    <Link
      to="/admin"
      className={`px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 block ${rightSidebarOpen ? 'mr-[310px]' : ''}`}
    >
      Admin Console
    </Link>
  );
};

const JoinInviteHandler = () => {
  const { type, token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const join = async () => {
      try {
        if (type === 'group') {
          await api.post(`/group/join/${token}`);
          dispatch(setAlert({ message: `Joined group successfully!`, severity: 'success' }));
        } else if (type === 'channel') {
          await api.post(`/channel/join/token/${token}`);
          dispatch(setAlert({ message: `Subscribed to channel successfully!`, severity: 'success' }));
        }
      } catch (err) {
        dispatch(setAlert({ message: err.response?.data?.message || 'Failed to join via invite link', severity: 'error' }));
      } finally {
        navigate('/', { replace: true });
      }
    };
    join();
  }, [type, token, dispatch, navigate]);

  return (
    <div className="min-h-screen bg-tg-bgDark flex items-center justify-center text-white">
      <div className="animate-pulse text-sm">Processing invite link...</div>
    </div>
  );
};

export const App = () => {
  const dispatch = useDispatch();
  const alertState = useSelector((state) => state.ui.alert);
  const theme = useSelector((state) => state.ui.theme);
  const globalLoading = useSelector((state) => state.ui.globalLoading);
  const inAppNotification = useSelector((state) => state.ui.inAppNotification);

  useEffect(() => {
    const el = document.documentElement;
    el.className = '';
    el.classList.add(`theme-${theme}`);
    if (theme !== 'light') {
      el.classList.add('dark');
    }
  }, [theme]);

  // Handle auto-clear for Telegram in-app notification Toast
  useEffect(() => {
    if (inAppNotification) {
      const timer = setTimeout(() => {
        dispatch(clearInAppNotification());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [inAppNotification, dispatch]);

  const handleCloseAlert = () => {
    dispatch(clearAlert());
  };

  return (
    <div className="h-full w-full">
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected app routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainDashboardLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/join/:type/:token"
          element={
            <ProtectedRoute>
              <JoinInviteHandler />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global glassmorphic loading spinner overlay */}
      <AnimatePresence>
        {globalLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-tg-bgDark/45 backdrop-blur-md z-[9999] flex items-center justify-center pointer-events-auto"
          >
            <div className="bg-tg-bgSidebarDark/90 border border-tg-borderDark/80 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4.5 max-w-[200px]">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-2 border-tg-blue/10 rounded-full" />
                <div className="absolute inset-0 border-2 border-tg-blue border-t-transparent rounded-full animate-spin" />
              </div>
              <span className="text-[10px] text-tg-textDefault font-bold uppercase tracking-widest animate-pulse">Processing...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-App Telegram-style Notification Toast */}
      <AnimatePresence>
        {inAppNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            onClick={() => {
              dispatch(setActiveChat(inAppNotification.chat));
              dispatch(clearInAppNotification());
            }}
            className="fixed top-6 right-6 z-[99999] w-[320px] max-w-[calc(100vw-48px)] p-3 bg-tg-bgSidebarDark/95 backdrop-blur-xl border border-tg-borderDark/80 rounded-2xl shadow-2xl flex items-center gap-3 cursor-pointer hover:brightness-110 active:scale-98 transition animate-slide-in"
          >
            {/* User Avatar */}
            <div className="w-9 h-9 rounded-xl bg-tg-bgDark flex-shrink-0 overflow-hidden flex items-center justify-center border border-tg-borderDark/60">
              {inAppNotification.avatar ? (
                <img src={getFileUrl(inAppNotification.avatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-tg-blue">{(inAppNotification.title || 'U')[0].toUpperCase()}</span>
              )}
            </div>

            {/* Notification content */}
            <div className="flex-grow min-w-0 text-left">
              <span className="text-[9px] text-tg-blue font-bold uppercase tracking-wider block">New Message</span>
              <h4 className="text-xs font-bold text-tg-textDefault truncate mt-0.5">{inAppNotification.title}</h4>
              <p className="text-[10px] text-tg-textMuted truncate mt-0.5 leading-normal">{inAppNotification.content}</p>
            </div>

            {/* Dismiss action */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch(clearInAppNotification());
              }}
              className="p-1 rounded-lg text-tg-textMuted hover:bg-tg-bgDark hover:text-tg-textDefault transition flex-shrink-0"
            >
              <CloseIcon fontSize="inherit" style={{ fontSize: '12px' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global alert notifications */}
      {alertState && (
        <Snackbar
          open={!!alertState}
          autoHideDuration={4000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseAlert} severity={alertState.severity} sx={{ width: '100%' }}>
            {alertState.message}
          </Alert>
        </Snackbar>
      )}
    </div>
  );
};

export default App;
