// API Configuration
const isDevelopment = import.meta.env.MODE === 'development';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (isDevelopment 
  ? 'http://localhost:5001'
  : '');

console.log('🔧 Config loaded - isDevelopment:', isDevelopment);
console.log('🔧 Config loaded - API_BASE_URL:', API_BASE_URL);

export const FRONTEND_URL = isDevelopment
  ? 'http://localhost:5173'
  : window.location.origin;

export const config = {
  apiUrl: API_BASE_URL,
  frontendUrl: FRONTEND_URL,
  isDevelopment,
};

export default config;
