import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
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

        {!otpSent ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-tg-textDefault tracking-tight">Create Account</h2>
              <p className="text-xs text-tg-textMuted mt-1">Register for internal corporate office messenger</p>
            </div>

            <form onSubmit={handleSubmitRegistration} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-semibold text-tg-textMuted mb-1 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="e.g. janesmith"
                  className="w-full px-4 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-tg-textMuted mb-1 uppercase tracking-wider">
                  Corporate Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="name@company.com"
                  className="w-full px-4 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-tg-textMuted mb-1 uppercase tracking-wider">
                  Mobile Number
                </label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g. +1 555-0199"
                  className="w-full px-4 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-tg-textMuted mb-1 uppercase tracking-wider">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-tg-textMuted mb-1 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-xs"
                />
                <PasswordStrengthMeter password={formData.password} />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-tg-textMuted mb-1 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-xs"
                />
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
                  className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg focus:border-tg-blue focus:outline-none text-tg-textDefault text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-tg-blue to-tg-darkBlue hover:brightness-110 active:scale-[0.98] text-white rounded-xl font-semibold text-xs transition shadow-lg shadow-tg-blue/20"
              >
                {loading ? 'Processing...' : 'Register Account'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-tg-blue/10 rounded-full flex items-center justify-center text-tg-blue mx-auto mb-4 border border-tg-blue/20">
              <CheckCircleOutlineIcon fontSize="large" />
            </div>
            <h2 className="text-2xl font-bold text-tg-textDefault mb-2">Verify Corporate Email</h2>
            <p className="text-xs text-tg-textMuted max-w-sm mx-auto mb-6">
              We have sent a 6-digit OTP verification code to <strong>{formData.email}</strong>.
            </p>

            <form onSubmit={handleVerifyOTP} className="max-w-xs mx-auto space-y-4">
              <div>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="w-full text-center px-4 py-3 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-lg font-bold tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-tg-blue hover:bg-tg-darkBlue text-white rounded-xl font-semibold text-xs transition"
              >
                {loading ? 'Verifying...' : 'Verify & Complete'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
