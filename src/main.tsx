
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('🚀 Main.tsx loading...');

// Get root element
const rootElement = document.getElementById("root")!;

if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

// Remove loading indicator
const loadingElement = rootElement.querySelector('.loading');
if (loadingElement) {
  console.log('🔄 Removing loading indicator');
  loadingElement.remove();
}

console.log('🔄 Creating React root...');

// Create and render React app
const root = createRoot(rootElement);
root.render(<App />);

console.log('✅ React app rendered');
