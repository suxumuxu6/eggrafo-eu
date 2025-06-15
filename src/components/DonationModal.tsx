import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, User, CreditCard, ExternalLink } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  documentTitle: string;
  documentId?: string;
}
interface UserData {
  name: string;
  email: string;
}

// Note: We no longer use the simple hosted PayPal URL, restored advanced logic!
const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  documentTitle,
  documentId
}) => {
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const PAYPAL_DONATION_AMOUNT = 12; // Set this to your intended amount in EUR

  const handlePayPalDonation = async () => {
    console.log('[DonationModal] handlePayPalDonation triggered');
    // Validate required fields before redirecting
    if (!userData.name.trim() || !userData.email.trim()) {
      toast.error('Please fill in your name and email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsProcessing(true);
    try {
      // Call the edge function to create a PayPal payment
      const { data, error } = await supabase.functions.invoke('create-paypal-payment', {
        body: {
          userData,
          documentId,
          documentTitle,
          donationAmount: PAYPAL_DONATION_AMOUNT, // Add amount here
        }
      });

      if (error) {
        console.error('PayPal payment creation error:', error);
        throw new Error(error.message || 'Failed to create payment');
      }

      // Handle if data is a string (sometimes returned by supabase.functions.invoke for edge functions)
      let parsedData: any = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          throw new Error("Could not parse server response");
        }
      }

      console.log('[DonationModal] PayPal API response:', parsedData);

      if (!parsedData.success) {
        throw new Error(parsedData.error || 'Payment creation failed');
      }

      // Store user data and donation info for later verification
      localStorage.setItem('pendingDonation', JSON.stringify({
        ...userData,
        documentTitle,
        documentId,
        donationId: parsedData.donationId,
        paymentId: parsedData.paymentId,
        timestamp: Date.now()
      }));

      toast.success('Redirecting to PayPal for payment...');
      console.log('[DonationModal] Redirecting to:', parsedData.approvalUrl);
      window.location.href = parsedData.approvalUrl;
      console.log('[DonationModal] Redirect call should have triggered');
    } catch (error: any) {
      console.error('Payment creation error:', error);
      toast.error(`Payment creation failed: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setUserData({
        name: '',
        email: ''
      });
      onClose();
    }
  };

  return <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-kb-blue" />
            Στηρίξτε μας
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-kb-blue mb-1">{documentTitle}</p>
            <p>Προκειμένου να δείτε το έγγραφο θα θέλαμε να μας ενισχύσετε κάνοντας δωρεά 12€.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Όνομα *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="name" type="text" value={userData.name} onChange={e => handleInputChange('name', e.target.value)} className="pl-10" required disabled={isProcessing} />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="email" type="email" value={userData.email} onChange={e => handleInputChange('email', e.target.value)} className="pl-10" required disabled={isProcessing} />
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Δωρεά 12€</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Θα μεταφερθείτε στο PayPal για να ολοκληρώσετε την δωρεά.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handlePayPalDonation} className="flex-1 bg-kb-blue hover:bg-kb-blue/90 text-white" disabled={isProcessing || !userData.name.trim() || !userData.email.trim()}>
              {isProcessing ? 'Creating Payment...' : <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Δωρεά μέσω Paypal
                </>}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>
              Ακύρωση
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Τα στοιχεία σας συλλέγονται μόνο για σκοπούς δωρεάς και δεν θα κοινοποιηθούν σε τρίτους.
          </p>
        </div>
      </DialogContent>
    </Dialog>;
};
export default DonationModal;
