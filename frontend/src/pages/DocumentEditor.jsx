import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import { io } from 'socket.io-client';
import html2pdf from 'html2pdf.js';
import 'react-quill-new/dist/quill.snow.css'; 
import Header from '../components/Header';
import api from '../axios';

function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [error, setError] = useState('');
  const [shareRole, setShareRole] = useState('viewer');
  const [isOwner, setIsOwner] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [canComment, setCanComment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socket, setSocket] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharedWith, setSharedWith] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (id === 'new') {
        setIsOwner(true);
        setCanEdit(true);
        setCanComment(true);
        return;
      }
      setCurrentUser(user);
      try {
        const response = await api.get(`/api/documents/${id}`, { withCredentials: true });
        setTitle(response.data.title);
        setValue(response.data.content);
        
        const isDocOwner = user && response.data.owner === user._id;
        const sharedUser = user && response.data.sharedWith.find(s => s.email === user.email);
        const role = isDocOwner ? 'owner' : (sharedUser ? sharedUser.role : 'viewer');
        
        setIsOwner(isDocOwner);
        setCanEdit(isDocOwner || role === 'editor');
        setCanComment(isDocOwner || role === 'editor' || role === 'commenter');
        setComments(response.data.comments || []);
        setSharedWith(response.data.sharedWith || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load document.');
      }
    };
    fetchDocument();
  }, [id]);

  useEffect(() => {
    if (id === 'new') return;
    const socket = io('http://localhost:3300');
    setSocket(socket);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    socket.emit('join-document', id, user);

    socket.on('new-comment', (comment) => {
      setComments((prev) => [...prev, comment]);
    });

    socket.on('delete-comment', (commentId) => {
      setComments((prev) => prev.filter(c => c._id !== commentId));
    });

    socket.on('receive-changes', (content) => {
      setValue(content);
    });

    socket.on('active-users', (users) => {
      // Deduplicate users by _id to avoid showing the same user multiple times if they have multiple tabs open
      const uniqueUsers = Array.from(new Map(users.map(u => [u._id, u])).values());
      setActiveUsers(uniqueUsers);
    });

    

    return () => socket.disconnect();
  }, [id]);

  useEffect(() => {
    if (id === 'new' || !canEdit) return;
    setIsSaving(true);
    const timer = setTimeout(async () => {

      try {
        await api.put(`/api/documents/${id}`, { title, content: value }, { withCredentials: true });
        setIsSaving(false);
      } catch (err) {
        console.error('Auto-save failed', err);
        setIsSaving(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [value, title, id, canEdit]);

  const handleSave = async () => {
    try {
      await api.put(`/api/documents/${id}`, { title, content: value, saveVersion: true }, { withCredentials: true });
      alert('Document saved!');
      navigate('/home');
    } catch (err) {
      console.error(err);
      setError('Failed to save document.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/api/documents/${id}`, { withCredentials: true });
        navigate('/home');
      } catch (err) {
        console.error(err);
        setError('Failed to delete document.');
      }
    }
  };

  const handleShare = () => {
    if (id === 'new') {
      alert('Please save the document before sharing.');
      return;
    }
    setShowShareModal(true);
  };

  const submitShare = async () => {
    try {
      const response = await api.post(`/api/documents/${id}/share`, { email: shareEmail, role: shareRole }, { withCredentials: true });
      setSharedWith(response.data.sharedWith);
      alert('Document shared successfully!');
      setShowShareModal(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Failed to share document.');
    }
  };

  const handleRemoveAccess = async (email) => {
    if (window.confirm(`Remove access for ${email}?`)) {
      try {
        const response = await api.post(`/api/documents/${id}/share/remove`, { email }, { withCredentials: true });
        setSharedWith(response.data.sharedWith);
      } catch (err) {
        console.error(err);
        setError('Failed to remove access.');
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleExportPDF = () => {
    const element = document.querySelector('.ql-editor');
    const opt = {
      margin:       1,
      filename:     `${title}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const response = await api.post(`/api/documents/${id}/comments`, { content: newComment }, { withCredentials: true });
      setComments(response.data);
      setNewComment('');
    } catch (err) {
      console.error(err);
      setError('Failed to add comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        const response = await api.delete(`/api/documents/${id}/comments/${commentId}`, { withCredentials: true });
        setComments(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to delete comment.');
      }
    }
  };

  const handleChange = (content, delta, source, editor) => {
    setValue(content);
    if (source === 'user' && socket) {
      socket.emit('send-changes', id, content);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await api.get(`/api/documents/${id}/versions`, { withCredentials: true });
      setVersions(response.data);
      setShowHistory(true);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch version history.');
    }
  };

  const handleRestore = async (versionId) => {
    if (window.confirm('Are you sure you want to restore this version? Current changes will be overwritten.')) {
      try {
        await api.put(`/api/documents/${id}/versions/${versionId}/restore`, {}, { withCredentials: true });
        setShowHistory(false);
      } catch (err) {
        console.error(err);
        setError('Failed to restore version.');
      }
    }
  };

  const modules = {
    toolbar: canEdit ? [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline','strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ] : false,
  };

  return (
    <div>
      <Header />
      <div className="editor-layout">
        <div className="editor-main">
          <div className="editor-header">
            {error && <p className="error-message">{error}</p>}
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="editor-title"
              disabled={!canEdit}
            />
            <div className="editor-actions">
              <div className="presence-indicators">
                {activeUsers.map(u => (
                  <div key={u._id} className="presence-avatar" title={u.username}>
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            {canEdit && <button onClick={handleSave} className="btn-save">{isSaving ? 'Saving...' : 'Save'}</button>}
            {isOwner && <button onClick={handleShare} className="btn-share">Share</button>}
            
            <div className="menu-container">
              <button onClick={() => setShowMenu(!showMenu)} className="btn-menu">⋮</button>
              {showMenu && (
                <div className="menu-dropdown">
                  <button onClick={() => { handleExportPDF(); setShowMenu(false); }} className="menu-item">Export PDF</button>
                  {isOwner && (
                    <>
                      <button onClick={() => { fetchVersions(); setShowMenu(false); }} className="menu-item">History</button>
                      <button onClick={() => { handleDelete(); setShowMenu(false); }} className="menu-item delete">Delete</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>
          <ReactQuill theme="snow" value={value} onChange={handleChange}  modules={modules} readOnly={!canEdit} />
        </div>
        
        {canComment && (<div className="comments-sidebar">
          <h3>Comments</h3>
          <div className="comments-list">
            {comments.map((comment, index) => (
              <div key={index} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.authorName}</span>
                  <span className="comment-date">{new Date(comment.createdAt).toLocaleString()}</span>
                  {(currentUser && (currentUser._id === comment.author || isOwner)) && (
                    <button onClick={() => handleDeleteComment(comment._id)} className="btn-delete-comment">x</button>
                  )}
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))}
          </div>
          {canComment && (
            <div className="add-comment">
              <textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="comment-input"
              />
              <button onClick={handleAddComment} className="btn-comment">Post Comment</button>
            </div>
          )} 
        </div>
        )}
         {!isOnline && <div className="offline-warning">You are currently offline. Changes will be synced when you reconnect.</div>}
      </div>

      {showHistory && (
        <div className="history-modal">
          <div className="history-content">
            <div className="history-header">
              <h3>Version History</h3>
              <button onClick={() => setShowHistory(false)} className="btn-close-history">Close</button>
            </div>
            <div className="history-list">
              {versions.length === 0 && <p>No history available.</p>}
              {versions.map(v => (
                <div key={v._id} className="history-item">
                  <div className="history-info">
                    <span className="history-date">{new Date(v.createdAt).toLocaleString()}</span>
                    <span className="history-user">by {v.updatedByName || 'Unknown'}</span>
                  </div>
                  <button onClick={() => handleRestore(v._id)} className="btn-restore">Restore</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
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
                <button onClick={submitShare} className="btn-submit-share">Share</button>
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
      )}
    </div>
  );
};

export default DocumentEditor;
