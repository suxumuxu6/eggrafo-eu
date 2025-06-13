
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <XCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Payment Cancelled
        </h2>
        <p className="text-gray-600 mb-6">
          You cancelled the payment process. No charges were made to your account.
        </p>
        <Button onClick={handleReturnHome} className="w-full">
          Return to Documents
        </Button>
      </div>
    </div>
  );
};

export default PaymentCancel;
