
import React from 'react';
import PasswordModal from '../components/PasswordModal';
import { BookOpen } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-kb-purple/10 to-kb-blue/10">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-kb-purple/10 rounded-full">
            <BookOpen className="h-12 w-12 text-kb-purple" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-kb-darkgray">Knowledge Base Portal</h1>
        <p className="text-gray-600 max-w-md">
          Access our secure document repository with comprehensive search capabilities.
        </p>
      </div>
      <PasswordModal />
    </div>
  );
};

export default Index;
