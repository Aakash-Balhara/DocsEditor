import React, { useState } from 'react';
import { useDocument } from '../context/DocumentContext';

const ShareModal = () => {
  const {
    showShareModal, setShowShareModal, submitShare, sharedWith, handleRemoveAccess
  } = useDocument();
  
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('viewer');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const onSubmit = () => {
    if (!shareEmail.trim()) {
      alert('Please enter an email address.');
      return;
    }
    submitShare(shareEmail, shareRole);
  };

  if (!showShareModal) return null;

  return (
    <div className="share-modal">
      <div className="share-content">
        <div className="share-header">
          <h3>Share Document</h3>
          <button onClick={() => setShowShareModal(false)} className="btn-close-share">&times;</button>
        </div>
        <div className="share-body">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={shareEmail} 
              onChange={(e) => setShareEmail(e.target.value)} 
              className="share-input"
              placeholder="Enter email"
            />
          </div>
          <div className="form-group">
            <label>Permission</label>
            <select value={shareRole} onChange={(e) => setShareRole(e.target.value)} className="share-select">
              <option value="viewer">Viewer</option>
              <option value="commenter">Commenter</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          <div className="share-modal-actions">
            <button onClick={onSubmit} className="btn-submit-share">Share</button>
            <button onClick={handleCopyLink} className="btn-copy-link">Copy Link</button>
          </div>
          
          <div className="shared-users-section">
            <h4>Who has access</h4>
            <div className="shared-users-list">
              {sharedWith.length === 0 && <p className="no-access-msg">No one has access yet.</p>}
              {sharedWith.map((user, index) => (
                <div key={index} className="shared-user-item">
                  <span>{user.email} ({user.role})</span>
                  <button onClick={() => handleRemoveAccess(user.email)} className="btn-remove-access">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
