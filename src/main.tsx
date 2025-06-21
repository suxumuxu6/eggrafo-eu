
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('🚀 Main.tsx loading...');

// Get root element and render immediately
const rootElement = document.getElementById("root")!;

if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

const loadingElement = rootElement.querySelector('.loading');

// Remove loading indicator immediately
if (loadingElement) {
  console.log('🔄 Removing loading indicator');
  loadingElement.remove();
}

console.log('🔄 Creating React root...');
// Render app directly without lazy loading for faster initial load
createRoot(rootElement).render(<App />);

console.log('✅ React app rendered');
