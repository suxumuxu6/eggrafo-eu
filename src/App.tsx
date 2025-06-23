
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Upload from './pages/Upload';
import DownloadPage from './pages/DownloadPage';
import Chatbot from './pages/Chatbot';
import AdminAuth from './pages/AdminAuth';
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
              <Route path="/upload" element={<Upload />} />
              <Route path="/download" element={<DownloadPage />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/auth" element={<AdminAuth />} />
            </Routes>
            <Toaster />
          </SecurityProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
