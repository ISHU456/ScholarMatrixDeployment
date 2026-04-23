// Central API Configuration Node
// This allows the platform to switch between local development and production (Render) automatically.

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? 'http://localhost:5001' 
    : 'http://localhost:5001');

export default API_URL;

