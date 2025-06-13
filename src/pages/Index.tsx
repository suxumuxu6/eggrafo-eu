
import React, { useState } from 'react';
import PasswordModal from '../components/PasswordModal';
import { BookOpen } from 'lucide-react';

const Index: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handlePasswordSubmit = (password: string) => {
    // Handle password validation here
    console.log('Password submitted:', password);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-kb-purple/10 to-kb-blue/10">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-kb-purple/10 rounded-full">
            <BookOpen className="h-12 w-12 text-kb-purple" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-kb-darkgray">Knowledge Portal</h1>
      </div>
      <PasswordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
};

export default Index;
