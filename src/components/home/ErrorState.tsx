
import React from 'react';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-blue-50">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12 max-w-md mx-auto">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Πρόβλημα Φόρτωσης</h3>
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <button 
            onClick={onRetry} 
            className="bg-kb-purple text-white px-6 py-2 rounded hover:bg-kb-purple/80 transition-colors font-medium"
          >
            Δοκιμάστε Ξανά
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Αν το πρόβλημα συνεχίζεται, παρακαλώ επικοινωνήστε με την υποστήριξη
          </p>
        </div>
      </main>
    </div>
  );
};

export default ErrorState;
