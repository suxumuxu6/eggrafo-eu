
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AdminAuthPage: React.FC = () => {
  const { signIn, isAuthenticated, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();

  console.log('AdminAuth render:', { isAuthenticated, isAdmin, loading });

  React.useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      console.log('✅ Admin authenticated, redirecting to upload page');
      navigate("/upload");
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Starting login process...');
    setFormLoading(true);
    
    try {
      const success = await signIn(email, password);
      console.log('Login result:', success);
      
      if (success) {
        console.log('✅ Login successful, waiting for admin verification...');
        setEmail("");
        setPassword("");
        // Don't navigate here, let the useEffect handle it after admin check
        toast.success("Συνδεθήκατε! Επαλήθευση διαχειριστή...");
        
        // Give some time for admin verification
        setTimeout(() => {
          // Check if still not admin after verification
          if (!isAdmin) {
            toast.error("Δεν έχετε δικαιώματα διαχειριστή");
          }
        }, 2000);
      } else {
        console.log('❌ Login failed');
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Έλεγχος δικαιωμάτων...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-blue-50">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Lock className="h-5 w-5 text-kb-purple" />
            Admin Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin} autoComplete="off">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-gray-400" />
                  Email
                </span>
              </label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={formLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                <span className="flex items-center gap-1">
                  <Lock className="h-4 w-4 text-gray-400" />
                  Password
                </span>
              </label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={formLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-kb-purple hover:bg-kb-purple/90"
                disabled={formLoading || loading}
              >
                {formLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
            <div className="text-xs text-gray-400 text-center pt-4">
              Only users with admin rights can log in here. If you don't have access, contact an administrator.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuthPage;
