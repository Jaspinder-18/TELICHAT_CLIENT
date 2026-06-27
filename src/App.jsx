import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearAlert, setAlert } from './redux/uiSlice.js';
import api from './services/api.js';

// MUI components
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

// Auth Components
import Login from './features/auth/Login.jsx';
import Register from './features/auth/Register.jsx';
import ForgotPassword from './features/auth/ForgotPassword.jsx';

// Core Dashboard Components
import Sidebar from './features/dashboard/Sidebar.jsx';
import ChatWindow from './features/dashboard/ChatWindow.jsx';
import RightPanel from './features/dashboard/RightPanel.jsx';

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
  const { user } = useSelector((state) => state.auth);
  const { activeChat } = useSelector((state) => state.chat);
  return (
    <SocketProvider>
      <div className="h-screen w-screen flex bg-tg-bgDark overflow-hidden relative">
        {/* Left pane containing sidebar */}
        <div className={`h-full w-full md:w-[320px] flex-shrink-0 ${activeChat ? 'hidden md:block' : 'block'}`}>
          <Sidebar />
        </div>
        
        {/* Central main chat view */}
        <div className={`h-full flex-grow ${activeChat ? 'block' : 'hidden md:block'}`}>
          <ChatWindow />
        </div>
        
        {/* Optional Right panel for info gallery */}
        <div className="h-full z-30 flex-shrink-0 absolute right-0 md:relative">
          <RightPanel />
        </div>

        {/* Floating admin link if user is administrator */}
        {user?.role === 'admin' && (
          <div className="absolute bottom-4 right-4 z-40">
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
    <a
      href="/admin"
      className={`px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 block ${rightSidebarOpen ? 'mr-[310px]' : ''}`}
    >
      Admin Console
    </a>
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

  useEffect(() => {
    const el = document.documentElement;
    el.className = '';
    el.classList.add(`theme-${theme}`);
    if (theme !== 'light') {
      el.classList.add('dark');
    }
  }, [theme]);

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
