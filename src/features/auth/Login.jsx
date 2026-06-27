import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api.js';
import { loginStart, loginSuccess, loginFailure } from '../../redux/authSlice.js';
import { setAlert } from '../../redux/uiSlice.js';
import Captcha from '../../components/Captcha.jsx';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    identity: '',
    password: '',
    rememberMe: false
  });
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCaptchaChange = (code) => {
    setCaptchaCode(code);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Verify Captcha
    if (captchaInput !== captchaCode) {
      setLocalError('CAPTCHA verification failed. Please try again.');
      return;
    }

    dispatch(loginStart());
    try {
      const res = await api.post('/auth/login', formData);
      dispatch(loginSuccess(res.data));
      dispatch(setAlert({ message: `Welcome back, ${res.data.user.fullName}!`, severity: 'success' }));
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      dispatch(loginFailure(errMsg));
      dispatch(setAlert({ message: errMsg, severity: 'error' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tg-bgDark p-4 relative overflow-hidden tg-chat-bg">
      {/* Decorative premium blurs */}
      <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] bg-tg-blue/15 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[600px] h-[600px] bg-purple-600/15 blur-[150px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-[92%] sm:w-full max-w-md bg-tg-bgSidebarDark/65 backdrop-blur-2xl border border-tg-borderDark/45 rounded-3xl shadow-2xl p-6 sm:p-9 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
            className="w-16 h-16 bg-gradient-to-tr from-tg-blue/15 to-tg-blue/30 rounded-2xl flex items-center justify-center text-tg-blue mb-4 border border-tg-blue/30 shadow-inner"
          >
            <LockOutlinedIcon fontSize="medium" />
          </motion.div>
          <h2 className="text-2xl font-bold text-tg-textDefault tracking-tight">Sign In</h2>
          <p className="text-xs text-tg-textMuted mt-1.5 font-medium tracking-wide">Enterprise Internal Office Chat</p>
        </div>

        {localError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-2xl mb-6 text-center font-medium"
          >
            {localError}
          </motion.div>
        )}
        
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-2xl mb-6 text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
              Email or Username
            </label>
            <input
              type="text"
              name="identity"
              value={formData.identity}
              onChange={handleChange}
              required
              placeholder="employee@company.com"
              className="w-full px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/30 focus:outline-none text-tg-textDefault text-sm placeholder-tg-textMuted/60 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/30 focus:outline-none text-tg-textDefault text-sm placeholder-tg-textMuted/60 transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between text-xs py-1.5 font-medium px-1">
            <label className="flex items-center text-tg-textMuted cursor-pointer select-none">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4.5 h-4.5 rounded-lg bg-tg-bgDark border-tg-borderDark text-tg-blue focus:ring-tg-blue/50 mr-2.5 cursor-pointer transition-all"
              />
              Remember Me
            </label>
            <Link
              to="/forgot-password"
              className="text-tg-blue hover:text-tg-lightBlue font-semibold transition-all hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* CAPTCHA Protection */}
          <div className="bg-tg-bgDark/40 p-4.5 border border-tg-borderDark/60 rounded-2xl space-y-3 shadow-inner">
            <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-0.5">
              Security Verification
            </label>
            <Captcha onChange={handleCaptchaChange} />
            <input
              type="text"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
              placeholder="Enter CAPTCHA characters"
              className="w-full px-4 py-2.5 bg-tg-bgDark/80 border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-xs transition"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-tg-blue to-tg-darkBlue hover:brightness-110 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-tg-blue/15 disabled:opacity-50 disabled:pointer-events-none mt-4 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowForwardIcon fontSize="inherit" style={{ fontSize: '14px' }} />
          </motion.button>
        </form>

        <div className="text-center mt-7 text-xs text-tg-textMuted font-medium">
          New on office communication?{' '}
          <Link
            to="/register"
            className="text-tg-blue hover:underline font-bold transition-all ml-0.5"
          >
            Create an Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
