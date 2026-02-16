import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import api from '../axios';

function Home() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await api.get('/api/documents', { withCredentials: true });
        setDocuments(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch documents.');
      }
    };
    fetchDocuments();
  }, []);

  const createNewDocument = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const response = await api.post('/api/documents', { title: 'Untitled Document' }, { withCredentials: true });
      navigate(`/document/${response.data._id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create document.');
      setIsCreating(false);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="home-container">
      <Header />
      <main className="home-main">
        <div className="home-header">
          <h2>My Documents</h2>
          <button onClick={createNewDocument} className="btn-create" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create New Document'}
          </button>
        </div>
        <div className="search-bar-container">
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="document-list">
          {filteredDocuments.map(doc => (
            <Link to={`/document/${doc._id}`} key={doc._id} className="document-item">
              <h3>{doc.title}</h3>
              <p>Last updated: {new Date(doc.updatedAt).toLocaleString()}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Home
