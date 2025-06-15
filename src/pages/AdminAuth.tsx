
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

  React.useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      navigate("/upload");
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const success = await signIn(email, password);
      if (success) {
        setEmail("");
        setPassword("");
      }
    } finally {
      setFormLoading(false);
    }
  };

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
                disabled={formLoading}
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

