import React, { useState } from 'react';
import { useDocument } from '../context/DocumentContext';

const CommentsSidebar = () => {
  const {
    comments, showComments, setShowComments, currentUser, isOwner,
    handleDeleteComment, handleAddComment, canComment
  } = useDocument();
  
  const [newComment, setNewComment] = useState('');

  const onAddComment = () => {
    if (!newComment.trim()) return;
    handleAddComment(newComment);
    setNewComment('');
  };

  if (!canComment || !showComments) return null;

  return (
    <div className="comments-sidebar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Comments</h3>
        <button 
          onClick={() => setShowComments(false)}
          className="btn-close-mobile"
          style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'inherit' }}
        >
          &times;
        </button>
      </div>
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
      <div className="add-comment">
        <textarea 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="comment-input"
        />
        <button onClick={onAddComment} className="btn-comment">Post Comment</button>
      </div>
    </div>
  );
};

export default CommentsSidebar;
