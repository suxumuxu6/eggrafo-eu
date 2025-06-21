
import React, { useEffect, useState } from 'react';

const LoadingState: React.FC = () => {
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-blue-50">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kb-purple mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Φόρτωση εγγράφων...</p>
          <p className="text-sm text-gray-500">Παρακαλώ περιμένετε...</p>
          {loadingTime > 5 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="text-yellow-700">
                Η φόρτωση διαρκεί περισσότερο από το αναμενόμενο...
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Ανανέωση Σελίδας
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LoadingState;
