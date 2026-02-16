import React, { useState } from 'react';
import { useDocument } from '../context/DocumentContext';

const EditorToolbar = () => {
  const {
    title, handleTitleChange, error, activeUsers, canComment, showComments, setShowComments,
    canEdit, handleSave, isSaving, isOwner, handleShare, handleExportPDF,
    fetchVersions, handleDelete
  } = useDocument();
  
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="editor-header">
      {error && <p className="error-message">{error}</p>}
      <input 
        type="text" 
        value={title} 
        onChange={handleTitleChange} 
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
        {canComment && (
          <button 
            onClick={() => setShowComments(!showComments)} 
            className="btn-toggle-comments"
            title={showComments ? "Hide Comments" : "Show Comments"}
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', marginRight: '10px' }}
          >
            💬
          </button>
        )}
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
  );
};

export default EditorToolbar;
