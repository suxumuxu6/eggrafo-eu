
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
      // Generate a unique, secure link_token
      function generateLinkToken(len = 32) {
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let token = "";
        for (let i = 0; i < len; i++) {
          token += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return token;
      }

      // Create donation record in database with pending status
      const link_token = generateLinkToken();
      const { data: donationData, error: donationError } = await supabase
        .from('donations')
        .insert({
          amount: PAYPAL_DONATION_AMOUNT,
          document_id: documentId || null,
          email: userData.email,
          status: 'pending',
          link_token,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        })
        .select()
        .single();

      if (donationError) {
        console.error('Error creating donation:', donationError);
        throw donationError;
      }

      console.log('[DonationModal] Created donation record:', donationData.id);

      // Store user data and donation info for later verification
      localStorage.setItem('pendingDonation', JSON.stringify({
        ...userData,
        documentTitle,
        documentId,
        donationId: donationData.id,
        link_token: link_token,
        timestamp: Date.now()
      }));

      // Construct PayPal hosted button URL with return URL and cancel URL
      const returnUrl = encodeURIComponent('https://eggrafo.work/payment-success');
      const cancelUrl = encodeURIComponent('https://eggrafo.work/payment-cancel');
      const paypalUrl = `https://www.paypal.com/donate/?hosted_button_id=NUHKAVN99YZ9U&custom=${donationData.id}&return=${returnUrl}&cancel_return=${cancelUrl}`;

      toast.success('Ανακατεύθυνση στο PayPal για πληρωμή...');
      console.log('[DonationModal] Redirecting to PayPal hosted button:', paypalUrl);
      
      // Redirect to PayPal hosted button
      window.location.href = paypalUrl;
      
    } catch (error: any) {
      console.error('Payment creation error:', error);
      setIsProcessing(false);
      toast.error(`Αποτυχία δημιουργίας πληρωμής: ${error.message}`);
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
              Θα μεταφερθείτε στο PayPal για να ολοκληρώσετε την δωρεά και θα επιστρέψετε αυτόματα.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handlePayPalDonation} className="flex-1 bg-kb-blue hover:bg-kb-blue/90 text-white" disabled={isProcessing || !userData.name.trim() || !userData.email.trim()}>
              {isProcessing ? 'Δημιουργία Πληρωμής...' : <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Δωρεά μέσω PayPal
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
