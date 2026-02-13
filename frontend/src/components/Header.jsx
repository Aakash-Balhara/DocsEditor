import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Header() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const getUser = () => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  };
  const user = getUser();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/signin');
  }

  return (
    <div className="header">
      <nav>
        <Link to="/"><h4>Docs Editor</h4></Link>
      </nav>
      <div className="user-menu" ref={dropdownRef}>
        <img 
          src="https://i.pravatar.cc/40" 
          alt="Avatar" 
          className="avatar" 
          onClick={() => setShowDropdown(!showDropdown)}
        />
        {showDropdown && (
          <div className="dropdown-content">
            {user ? (
              <>
                <div className="dropdown-item-header">
                  Signed in as <br />
                  <strong>{user.username || 'User'}</strong>
                </div>
                <hr />
                <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>Profile</Link>
                <button onClick={logout} className="dropdown-item">Logout</button>
              </>
            ) : (
              <>
                <div className="dropdown-item-header">Guest</div>
                <hr />
                <Link to="/signin" className="dropdown-item" onClick={() => setShowDropdown(false)}>Sign In</Link>
                <Link to="/signup" className="dropdown-item" onClick={() => setShowDropdown(false)}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Header
