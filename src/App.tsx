
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Documents from './pages/Documents';
import About from './pages/About';
import Contact from './pages/Contact';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import DownloadPage from './pages/DownloadPage';
import Chatbot from './pages/Chatbot';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster"
import { SecurityProvider } from '@/components/security/SecurityProvider';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SecurityProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/download" element={<DownloadPage />} />
              <Route path="/chatbot" element={<Chatbot />} />
            </Routes>
            <Toaster />
          </SecurityProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
