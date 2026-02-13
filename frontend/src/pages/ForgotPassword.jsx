import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/api/password-reset/request-otp', { email });
      setStep(2);
      setMessage('OTP sent to your email.');
      setResendTimer(30);
    } catch (err) {
      console.error("Request OTP Error:", err);
      setError(err.response?.data?.msg || 'Failed to send OTP.');
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError('');
    setMessage('');
    try {
      await api.post('/api/password-reset/request-otp', { email });
      setMessage('OTP resent to your email.');
      setResendTimer(30);
    } catch (err) {
      console.error("Resend OTP Error:", err);
      setError(err.response?.data?.msg || 'Failed to resend OTP.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/api/password-reset/reset-password', { email, otp, newPassword });
      setMessage('Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err) {
      console.error("Reset Password Error:", err);
      setError(err.response?.data?.msg || 'Failed to reset password.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-form-container">
        <h2>Forgot Password</h2>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        
        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit">Send OTP</button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <button type="submit">Reset Password</button>
            <button 
              type="button" 
              onClick={handleResendOtp} 
              disabled={resendTimer > 0}
              style={{ 
                marginTop: '10px', 
                background: 'transparent', 
                color: resendTimer > 0 ? '#cbd5e0' : '#718096', 
                border: '1px solid #e2e8f0',
                cursor: resendTimer > 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend OTP'}
            </button>
          </form>
        )}
        <p>
          Remembered your password? <Link to="/signin">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
