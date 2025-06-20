
import { createRoot } from 'react-dom/client';

// Lazy load the App component for better performance
const App = import('./App.tsx');

// Optimize CSS loading
import('./index.css');

// Get root element and remove loading indicator
const rootElement = document.getElementById("root")!;
const loadingElement = rootElement.querySelector('.loading');

App.then(({ default: AppComponent }) => {
  if (loadingElement) {
    loadingElement.remove();
  }
  createRoot(rootElement).render(<AppComponent />);
}).catch(error => {
  console.error('Failed to load app:', error);
  rootElement.innerHTML = '<div style="padding: 20px; text-align: center;">Failed to load application. Please refresh the page.</div>';
});
