
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { DocumentsSection } from '@/components/DocumentsSection';

const Documents = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <DocumentsSection />
    </div>
  );
};

export default Documents;
