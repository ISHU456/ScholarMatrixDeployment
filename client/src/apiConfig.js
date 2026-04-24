// Central API Configuration Node
// This allows the platform to switch between local development and production (Render) automatically.

const getApiUrl = () => {
  // Priority 1: Environment variable from Vite build
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Priority 2: Automatic detection for Render deployments
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Explicit mapping for known deployments
    if (hostname.includes('scholarmatrixdeployment')) {
      return 'https://scholarmatrixdeployment-server.onrender.com';
    }
    
    if (hostname.includes('colabmernscholarnode')) {
      return 'https://colabmernscholarnodeserver.onrender.com';
    }
    
    // General fallback for other Render subdomains
    if (hostname.includes('onrender.com')) {
      return window.location.origin.replace('-client', '-server');
    }
  }

  // Priority 3: Local development fallback
  return 'http://localhost:5001';
};

const API_URL = getApiUrl();

// Immediate assignment to window for sync access in other modules
if (typeof window !== 'undefined') {
  window.API_URL = API_URL;
}

export default API_URL;
