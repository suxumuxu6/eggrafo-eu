
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const HCAPTCHA_SITEKEY = "10000000-ffff-ffff-ffff-000000000001"; // <-- REPLACE ME!

const AdminAuthPage: React.FC = () => {
  const { signIn, isAuthenticated, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const captchaRef = React.useRef<HCaptcha>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      navigate("/upload");
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setCaptchaError("Παρακαλώ λύστε το hCaptcha.");
      return;
    }
    setFormLoading(true);
    setCaptchaError(null);
    try {
      // Pass the captchaToken in the options object
      // Supabase expects { captchaToken }
      // Your context AuthContext must also be updated if needed,
      // but by default, supabase-js handles it as an extra param.
      const success = await signIn(email, password, captchaToken);
      if (success) {
        setEmail("");
        setPassword("");
        setCaptchaToken(null);
        if (captchaRef.current) captchaRef.current.resetCaptcha();
      }
    } finally {
      setFormLoading(false);
    }
  };

  // hCaptcha callback handlers
  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError(null);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
    setCaptchaError("Το hCaptcha έληξε. Παρακαλώ δοκιμάστε ξανά.");
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
            <div className="flex justify-center">
              <HCaptcha
                sitekey={HCAPTCHA_SITEKEY}
                onVerify={handleCaptchaVerify}
                onExpire={handleCaptchaExpire}
                ref={captchaRef}
                theme="light"
              />
            </div>
            {captchaError && (
              <div className="text-xs text-red-500 text-center">{captchaError}</div>
            )}
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
