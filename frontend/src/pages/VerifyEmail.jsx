import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../axios';

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState('Verifying...');
  const [error, setError] = useState('');
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const verify = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        setMessage(response.data.msg);
      } catch (err) {
        setMessage('');
        setError(err.response?.data?.msg || 'Verification failed.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="auth-wrapper">
      <div className="auth-form-container" style={{ textAlign: 'center' }}>
        <h2>Email Verification</h2>
        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <p className="success-message">{message}</p>
        )}
        <Link to="/signin" style={{ color: '#667eea', fontWeight: 'bold' }}>Go to Sign In</Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
