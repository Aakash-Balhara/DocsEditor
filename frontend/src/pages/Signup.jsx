import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../axios';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/signup', { username, email, password }, { withCredentials: true });
      setMessage('Signup successful! Please check your email for a verification link.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Failed to sign up. Please try again.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-form-container">
        <h2>Sign Up</h2>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        {!message && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit">Sign Up</button>
        </form>
        )}
        <p>
          {message ? 'Go to ' : 'Already have an account? '} <Link to="/signin">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;