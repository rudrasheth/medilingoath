import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { API_BASE_URL } from "./lib/config";

// Global fetch interceptor to properly handle session cookies
const originalFetch = window.fetch;
window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
  let urlStr = '';
  if (typeof input === 'string') urlStr = input;
  else if (input instanceof URL) urlStr = input.toString();
  else urlStr = input.url;

  // Add credentials if it's an API request
  if (urlStr.includes('/api/') || urlStr.includes(API_BASE_URL)) {
    init = init || {};
    init.credentials = 'include';
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
