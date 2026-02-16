import React from 'react';
import { useDocument } from '../context/DocumentContext';

const HistoryModal = () => {
  const { showHistory, setShowHistory, versions, handleRestore } = useDocument();

  if (!showHistory) return null;

  return (
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
  );
};

export default HistoryModal;
