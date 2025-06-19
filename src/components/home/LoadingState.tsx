
import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-50">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kb-purple mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Φόρτωση εγγράφων...</p>
          <p className="text-sm text-gray-500">Παρακαλώ περιμένετε...</p>
        </div>
      </main>
    </div>
  );
};

export default LoadingState;
