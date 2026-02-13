import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../axios';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setUsername(userData.username);
      setEmail(userData.email);
    } else {
        navigate('/signin');
    }
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.put('/auth/update', { username, email, password }, { withCredentials: true });
      setMessage(response.data.msg);
      
      if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setUser(response.data.user);
      }
      setPassword('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Failed to update profile');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/auth/delete', { withCredentials: true });
        localStorage.removeItem('user');
        navigate('/signin');
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || 'Failed to delete account');
      }
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <Header />
      <div className="auth-wrapper">
        <div className="auth-form-container">
          <h2>Profile</h2>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>New Password (leave blank to keep current)</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="********"
              />
            </div>
            <button type="submit">Update Profile</button>
          </form>
          <button onClick={handleDelete} className="btn-delete">Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
