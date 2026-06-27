import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { setAlert } from '../../redux/uiSlice.js';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
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
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-tg-blue opacity-10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600 opacity-10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-[92%] sm:w-full max-w-md bg-tg-bgSidebarDark/90 backdrop-blur-xl border border-tg-borderDark rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 animate-slide-in">
        <Link
          to="/login"
          className="inline-flex items-center text-xs text-tg-textMuted hover:text-tg-textDefault mb-6 transition"
        >
          <ArrowBackIcon fontSize="inherit" className="mr-1" /> Back to Sign In
        </Link>

        {localError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg mb-6 text-center">
            {localError}
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-tg-blue/10 rounded-full flex items-center justify-center text-tg-blue mb-4 border border-tg-blue/20">
                <MailOutlineIcon fontSize="large" />
              </div>
              <h2 className="text-xl font-bold text-tg-textDefault tracking-tight">Forgot Password</h2>
              <p className="text-xs text-tg-textMuted mt-1 text-center">
                Enter your registered corporate email to receive a password reset verification code.
              </p>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-tg-textMuted mb-1 uppercase tracking-wider">
                  Corporate Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full px-4 py-2.5 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-tg-blue hover:bg-tg-darkBlue text-white rounded-xl font-semibold text-sm transition"
              >
                {loading ? 'Sending OTP...' : 'Send OTP Verification'}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-tg-blue/10 rounded-full flex items-center justify-center text-tg-blue mb-4 border border-tg-blue/20">
                <DateRangeIcon fontSize="large" />
              </div>
              <h2 className="text-xl font-bold text-tg-textDefault tracking-tight">Verify Identity</h2>
              <p className="text-xs text-tg-textMuted mt-1 text-center">
                Verify OTP code and your registered date of birth for authentication.
              </p>
            </div>

            <form onSubmit={handleVerifyOtpAndDob} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-tg-textMuted mb-1 uppercase tracking-wider">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  placeholder="e.g. 128492"
                  className="w-full text-center px-4 py-2.5 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-sm font-bold tracking-wider"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-tg-textMuted mb-1 uppercase tracking-wider">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-tg-blue hover:bg-tg-darkBlue text-white rounded-xl font-semibold text-sm transition"
              >
                {loading ? 'Verifying...' : 'Verify Details'}
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-tg-blue/10 rounded-full flex items-center justify-center text-tg-blue mb-4 border border-tg-blue/20">
                <LockResetIcon fontSize="large" />
              </div>
              <h2 className="text-xl font-bold text-tg-textDefault tracking-tight">Set New Password</h2>
              <p className="text-xs text-tg-textMuted mt-1">Please enter your new password below.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-tg-textMuted mb-1 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-tg-textMuted mb-1 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-tg-blue to-tg-darkBlue hover:brightness-110 active:scale-[0.98] text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-tg-blue/20"
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
