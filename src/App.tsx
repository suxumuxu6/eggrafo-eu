
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Upload from './pages/Upload';
import DownloadPage from './pages/DownloadPage';
import Chatbot from './pages/Chatbot';
import AdminAuth from './pages/AdminAuth';
import AdminChatbot from './pages/AdminChatbot';
import AdminDonations from './pages/AdminDonations';
import UserSupport from './pages/UserSupport';
import NewRequest from './pages/NewRequest';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster"
import { SecurityProvider } from '@/components/security/SecurityProvider';
import Navbar from './components/Navbar';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SecurityProvider>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/download" element={<DownloadPage />} />
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/auth" element={<AdminAuth />} />
                <Route path="/admin-chatbot" element={<AdminChatbot />} />
                <Route path="/admin-donations" element={<AdminDonations />} />
                <Route path="/support" element={<UserSupport />} />
                <Route path="/new-request" element={<NewRequest />} />
              </Routes>
            </div>
            <Toaster />
          </SecurityProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
