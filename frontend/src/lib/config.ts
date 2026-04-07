// API Configuration
const isDevelopment = true; // Set to true for local development

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3000'
  : 'https://medilingoath.vercel.app';

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
