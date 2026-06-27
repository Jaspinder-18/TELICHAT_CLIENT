import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api.js';
import { setAlert } from '../../redux/uiSlice.js';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import DateRangeIcon from '@mui/icons-material/DateRange';
import LockResetIcon from '@mui/icons-material/LockReset';

export const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // Steps 1 to 3
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  // Step 1: Send OTP request
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      dispatch(setAlert({ message: 'If the email exists, a password reset OTP has been sent.', severity: 'success' }));
      setStep(2);
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and DOB
  const handleVerifyOtpAndDob = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    try {
      await api.post('/auth/verify-forgot-password-otp', {
        email,
        otp,
        dateOfBirth
      });
      dispatch(setAlert({ message: 'OTP and Date of Birth verified.', severity: 'success' }));
      setStep(3);
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Verification failed. Check OTP or Date of Birth.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (newPassword !== confirmNewPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        dateOfBirth,
        newPassword,
        confirmNewPassword
      });
      dispatch(setAlert({ message: 'Password reset successfully. You can now log in.', severity: 'success' }));
      navigate('/login');
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
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

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-tg-blue/15 to-tg-blue/30 rounded-2xl flex items-center justify-center text-tg-blue mb-4 border border-tg-blue/30 shadow-inner">
                  <MailOutlineIcon fontSize="medium" />
                </div>
                <h2 className="text-2xl font-bold text-tg-textDefault tracking-tight">Forgot Password</h2>
                <p className="text-xs text-tg-textMuted mt-2 text-center leading-relaxed font-medium">
                  Enter your registered corporate email to receive a password reset verification code.
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/30 focus:outline-none text-tg-textDefault text-sm placeholder-tg-textMuted/60 transition-all shadow-inner"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-tg-blue to-tg-darkBlue hover:brightness-110 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-tg-blue/15 disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP Verification'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-tg-blue/15 to-tg-blue/30 rounded-2xl flex items-center justify-center text-tg-blue mb-4 border border-tg-blue/30 shadow-inner">
                  <DateRangeIcon fontSize="medium" />
                </div>
                <h2 className="text-2xl font-bold text-tg-textDefault tracking-tight">Verify Identity</h2>
                <p className="text-xs text-tg-textMuted mt-2 text-center leading-relaxed font-medium">
                  Verify OTP code and your registered date of birth for authentication.
                </p>
              </div>

              <form onSubmit={handleVerifyOtpAndDob} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="e.g. 128492"
                    className="w-full text-center px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-sm font-bold tracking-wider shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/30 focus:outline-none text-tg-textDefault text-sm transition-all shadow-inner"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-tg-blue to-tg-darkBlue hover:brightness-110 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-tg-blue/15 disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify Details'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-tg-blue/15 to-tg-blue/30 rounded-2xl flex items-center justify-center text-tg-blue mb-4 border border-tg-blue/30 shadow-inner">
                  <LockResetIcon fontSize="medium" />
                </div>
                <h2 className="text-2xl font-bold text-tg-textDefault tracking-tight">Set New Password</h2>
                <p className="text-xs text-tg-textMuted mt-2 text-center leading-relaxed font-medium">Please enter your new password below.</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/30 focus:outline-none text-tg-textDefault text-sm placeholder-tg-textMuted/60 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-tg-textMuted uppercase tracking-wider ml-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-tg-bgDark/80 border border-tg-borderDark rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/30 focus:outline-none text-tg-textDefault text-sm placeholder-tg-textMuted/60 transition-all shadow-inner"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-tg-blue to-tg-darkBlue hover:brightness-110 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-tg-blue/15 disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
                >
                  {loading ? 'Updating Password...' : 'Reset Password'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
