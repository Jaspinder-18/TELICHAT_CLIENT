import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
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
      {/* Decorative gradient blur */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-tg-blue opacity-10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600 opacity-10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-[92%] sm:w-full max-w-md bg-tg-bgSidebarDark/90 backdrop-blur-xl border border-tg-borderDark rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 animate-slide-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-tg-blue/10 rounded-full flex items-center justify-center text-tg-blue mb-4 border border-tg-blue/20">
            <LockOutlinedIcon fontSize="large" />
          </div>
          <h2 className="text-2xl font-bold text-tg-textDefault tracking-tight">Sign In</h2>
          <p className="text-xs text-tg-textMuted mt-1">Enterprise Internal Office Chat</p>
        </div>

        {localError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg mb-6 text-center">
            {localError}
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-tg-textMuted mb-1.5 uppercase tracking-wide">
              Email or Username
            </label>
            <input
              type="text"
              name="identity"
              value={formData.identity}
              onChange={handleChange}
              required
              placeholder="e.g. employee@company.com"
              className="w-full px-4 py-2.5 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-sm placeholder-tg-textMuted transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tg-textMuted mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-sm placeholder-tg-textMuted transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <label className="flex items-center text-tg-textMuted cursor-pointer select-none">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 rounded bg-tg-bgDark border-tg-borderDark text-tg-blue focus:ring-tg-blue mr-2 cursor-pointer"
              />
              Remember Me
            </label>
            <Link
              to="/forgot-password"
              className="text-tg-blue hover:text-tg-lightBlue font-medium transition"
            >
              Forgot Password?
            </Link>
          </div>

          {/* CAPTCHA Protection */}
          <div className="bg-tg-bgDark/50 p-4 border border-tg-borderDark rounded-xl space-y-3">
            <label className="block text-[11px] font-semibold text-tg-textMuted uppercase tracking-wide">
              Security Verification
            </label>
            <Captcha onChange={handleCaptchaChange} />
            <input
              type="text"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
              placeholder="Enter CAPTCHA characters"
              className="w-full px-3 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-lg focus:border-tg-blue focus:outline-none text-tg-textDefault text-xs transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-tg-blue to-tg-darkBlue hover:brightness-110 active:scale-[0.98] text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-tg-blue/20 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowForwardIcon fontSize="small" />
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-tg-textMuted">
          New on office communication?{' '}
          <Link
            to="/register"
            className="text-tg-blue hover:underline font-semibold"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
