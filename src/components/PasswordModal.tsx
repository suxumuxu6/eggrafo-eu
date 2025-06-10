
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PasswordModal: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-white shadow-lg animate-fade-in w-full max-w-md mx-auto">
      <div className="mb-8 p-3 bg-kb-purple/10 rounded-full">
        <Lock className="h-8 w-8 text-kb-purple" />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-center">ΕΒΕΑ- ΤΜΗΜΑ ΟΕ/ΕΕ</h2>
      <p className="text-gray-500 mb-6 text-center">Πληκτρολογήστε τον κωδικό πρόσβασης</p>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="space-y-4">
          <Input 
            type="password" 
            placeholder="Enter password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full" 
            required 
          />
          <Button 
            type="submit" 
            className="w-full bg-kb-purple hover:bg-kb-purple/90" 
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Access Knowledge Base'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PasswordModal;
