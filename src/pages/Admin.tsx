
import React from 'react';
import { Navbar } from '@/components/Navbar';

const Admin = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        <p className="text-gray-600">Admin functionality coming soon...</p>
      </div>
    </div>
  );
};

export default Admin;
