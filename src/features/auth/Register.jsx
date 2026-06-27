import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api.js';
import { setAlert } from '../../redux/uiSlice.js';
import Captcha from '../../components/Captcha.jsx';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter.jsx';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobileNumber: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
  });

  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');

  // OTP Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCaptchaChange = (code) => {
    setCaptchaCode(code);
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (captchaInput !== captchaCode) {
      setLocalError('CAPTCHA verification failed');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', formData);

      dispatch(
        setAlert({
          message: 'Registration initiated. Verification OTP has been sent to your email.',
          severity: 'success',
        })
      );
      setOtpSent(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setLocalError(msg);
      dispatch(setAlert({ message: msg, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    try {
      await api.post('/auth/verify-email', {
        email: formData.email,
        otp: otpInput,
      });

      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      });

      dispatch(
        setAlert({
          message: 'Account created successfully! You can now log in.',
          severity: 'success',
        })
      );
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP';
      setLocalError(msg);
      dispatch(setAlert({ message: msg, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tg-bgDark p-4 relative overflow-y-auto tg-chat-bg py-12">
      {/* Decorative premium blurs */}
      <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] bg-tg-blue/15 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[600px] h-[600px] bg-purple-600/15 blur-[150px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-[92%] sm:w-full max-w-md bg-tg-bgSidebarDark/65 backdrop-blur-2xl border border-tg-borderDark/45 rounded-3xl shadow-2xl p-6 sm:p-9 relative z-10"
      >
        <Link
          to="/login"
          className="inline-flex items-center text-xs font-semibold text-tg-textMuted hover:text-tg-textDefault mb-6 transition hover:underline"
        >
          <ArrowBackIcon fontSize="inherit" className="mr-1.5" style={{ fontSize: '12px' }} /> Back to Sign In
        </Link>

        {localError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-2xl mb-6 text-center font-medium"
          >
            {localError}
          </motion.div>
        )}

        {!otpSent ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-tg-textDefault tracking-tight">Create Account</h2>
              <p className="text-xs text-tg-textMuted mt-1.5 font-medium tracking-wide">Register for internal corporate office messenger</p>
            </div>

            <form onSubmit={handleSubmitRegistration} className="space-y-4.5 text-left">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="janesmith"
                  className="w-full px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/30 focus:outline-none text-tg-textDefault text-sm placeholder-tg-textMuted/60 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
                  Corporate Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/30 focus:outline-none text-tg-textDefault text-sm placeholder-tg-textMuted/60 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  required
                  placeholder="+1 555-0199"
                  className="w-full px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/30 focus:outline-none text-tg-textDefault text-sm placeholder-tg-textMuted/60 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/30 focus:outline-none text-tg-textDefault text-sm transition-all shadow-inner"
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
                <div className="px-1 pt-1">
                  <PasswordStrengthMeter password={formData.password} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/30 focus:outline-none text-tg-textDefault text-sm placeholder-tg-textMuted/60 transition-all shadow-inner"
                />
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
                className="w-full py-3.5 bg-gradient-to-r from-tg-blue to-tg-darkBlue hover:brightness-110 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-tg-blue/15 disabled:opacity-50 disabled:pointer-events-none mt-4 cursor-pointer"
              >
                {loading ? 'Processing...' : 'Register Account'}
              </motion.button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <motion.div
              initial={{ scale: 0.8, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-tg-blue/10 rounded-2xl flex items-center justify-center text-tg-blue mx-auto mb-5 border border-tg-blue/20 shadow-inner"
            >
              <CheckCircleOutlineIcon fontSize="medium" />
            </motion.div>
            <h2 className="text-2xl font-bold text-tg-textDefault mb-2">Verify Corporate Email</h2>
            <p className="text-xs text-tg-textMuted max-w-sm mx-auto mb-6 leading-relaxed font-medium">
              We have sent a 6-digit OTP verification code to <strong className="text-tg-textDefault">{formData.email}</strong>.
            </p>

            <form onSubmit={handleVerifyOTP} className="max-w-xs mx-auto space-y-5">
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                required
                maxLength={6}
                placeholder="Enter OTP"
                className="w-full text-center px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-lg font-bold tracking-widest shadow-inner"
              />

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-tg-blue hover:bg-tg-darkBlue text-white rounded-2xl font-bold text-xs transition shadow-md cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify & Complete'}
              </motion.button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Register;
