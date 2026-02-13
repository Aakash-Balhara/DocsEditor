import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../axios';

const Signin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/signin', { email, password }, { withCredentials: true });
      const { user } = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/home'); 
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Failed to sign in. Please check your credentials.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-form-container">
        <h2>Sign In</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit">Sign In</button>
        </form>
        <p style={{ marginTop: '1rem' }}>
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
        <p>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Signin;