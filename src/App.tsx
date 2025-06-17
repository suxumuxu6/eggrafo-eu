import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./components/PaymentSuccess";
import PaymentCancel from "./components/PaymentCancel";
import DocumentDownload from "./pages/DocumentDownload";
import { AuthProvider } from "./context/AuthContext";
import AdminAuthPage from "./pages/AdminAuth";
import AdminChatbot from "./pages/AdminChatbot";
import AdminDonations from "./pages/AdminDonations";
import Navbar from "@/components/Navbar";
import ChatbotReply from "@/pages/ChatbotReply";
import UserSupport from "@/pages/UserSupport";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <div className="min-h-screen bg-white">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/auth" element={<AdminAuthPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<PaymentCancel />} />
              <Route path="/download" element={<DocumentDownload />} />
              <Route path="/admin-chatbot" element={<AdminChatbot />} />
              <Route path="/admin-donations" element={<AdminDonations />} />
              <Route path="/reply" element={<ChatbotReply />} />
              <Route path="/support" element={<UserSupport />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
