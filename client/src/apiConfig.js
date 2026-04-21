// Central API Configuration Node
// This allows the platform to switch between local development and production (Render) automatically.

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? window.location.origin.replace('-1.onrender.com', '-api.onrender.com').replace('scholarnode-ui', 'scholarnode-api')
    : 'http://localhost:5001');

export default API_URL;
