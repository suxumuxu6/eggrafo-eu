
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Get root element and render immediately
const rootElement = document.getElementById("root")!;
const loadingElement = rootElement.querySelector('.loading');

// Remove loading indicator immediately
if (loadingElement) {
  loadingElement.remove();
}

// Render app directly without lazy loading for faster initial load
createRoot(rootElement).render(<App />);
