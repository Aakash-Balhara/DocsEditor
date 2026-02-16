import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import html2pdf from 'html2pdf.js';
import api from '../axios';

const DocumentContext = createContext();

export const useDocument = () => useContext(DocumentContext);

export const DocumentProvider = ({ children }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [value, setValue] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [comments, setComments] = useState([]);
  const [canComment, setCanComment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socket, setSocket] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedWith, setSharedWith] = useState([]);
  const [showComments, setShowComments] = useState(window.innerWidth > 768);
  const saveTimeoutRef = useRef(null);

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
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const socketUrl = isLocal ? 'http://localhost:3300' : 'https://docseditor-cdrg.onrender.com';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    newSocket.emit('join-document', id, user);

    newSocket.on('new-comment', (comment) => {
      setComments((prev) => [...prev, comment]);
    });

    newSocket.on('delete-comment', (commentId) => {
      setComments((prev) => prev.filter(c => c._id !== commentId));
    });

    newSocket.on('receive-changes', (content) => {
      setValue(content);
    });

    newSocket.on('active-users', (users) => {
      const uniqueUsers = Array.from(new Map(users.map(u => [u._id, u])).values());
      setActiveUsers(uniqueUsers);
    });

    return () => newSocket.disconnect();
  }, [id]);

  // Cleanup save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const triggerSave = (newTitle, newContent) => {
    if (id === 'new' || !canEdit) return;
    
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.put(`/api/documents/${id}`, { title: newTitle, content: newContent }, { withCredentials: true });
        setIsSaving(false);
      } catch (err) {
        console.error('Auto-save failed', err);
        setIsSaving(false);
      }
    }, 2000);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (id === 'new') {
        const response = await api.post('/api/documents', { title, content: value }, { withCredentials: true });
        navigate(`/document/${response.data._id}`);
      } else {
        await api.put(`/api/documents/${id}`, { title, content: value, saveVersion: true }, { withCredentials: true });
        alert('Document saved!');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save document.');
    } finally {
      setIsSaving(false);
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

  const submitShare = async (email, role) => {
    try {
      const response = await api.post(`/api/documents/${id}/share`, { email, role }, { withCredentials: true });
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

  const handleAddComment = async (content) => {
    try {
      const response = await api.post(`/api/documents/${id}/comments`, { content }, { withCredentials: true });
      setComments(response.data);
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

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerSave(newTitle, value);
  };

  const handleChange = (content, delta, source, editor) => {
    setValue(content);
    if (source === 'user' && socket) {
      socket.emit('send-changes', id, content);
      triggerSave(title, content);
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

  return (
    <DocumentContext.Provider value={{
      id, value, setValue, title, setTitle, error, setError,
      isOwner, canEdit, comments, canComment, currentUser,
      isOnline, isSaving, activeUsers, showHistory, setShowHistory,
      versions, showShareModal, setShowShareModal, sharedWith,
      showComments, setShowComments,
      handleSave, handleDelete, handleShare, submitShare, handleRemoveAccess,
      handleExportPDF, handleAddComment, handleDeleteComment, handleChange, handleTitleChange,
      fetchVersions, handleRestore
    }}>
      {children}
    </DocumentContext.Provider>
  );
};
