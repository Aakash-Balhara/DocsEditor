import axios from 'axios';

const api = axios.create({
  baseURL: 'https://docseditor-cdrg.onrender.com', // Replace with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;