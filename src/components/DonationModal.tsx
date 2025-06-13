
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, User, CreditCard, ExternalLink } from 'lucide-react';
import { toast } from "sonner";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handlePayPalDonation = async () => {
    // Validate required fields
    if (!userData.name.trim() || !userData.email.trim()) {
      toast.error('Please fill in your name and email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create PayPal payment through Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-paypal-payment', {
        body: {
          userData,
          documentId,
          documentTitle
        }
      });

      if (error) throw error;

      if (data.success) {
        // Store user data and donation info for verification
        localStorage.setItem('pendingDonation', JSON.stringify({
          ...userData,
          documentTitle,
          documentId,
          donationId: data.donationId,
          paymentId: data.paymentId,
          timestamp: Date.now()
        }));

        toast.success('Redirecting to PayPal for payment...');
        
        // Redirect to PayPal
        window.location.href = data.approvalUrl;
      } else {
        throw new Error(data.error || 'Failed to create payment');
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      toast.error(`Payment creation failed: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setUserData({ name: '', email: '' });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-kb-blue" />
            Registration & Donation Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-kb-blue mb-1">Access Document: {documentTitle}</p>
            <p>To view this document, please register your details and make a 20€ donation via PayPal.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={userData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-10"
                  required
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={userData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Donation Amount: 20€</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              You will be redirected to PayPal to complete the secure payment process.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handlePayPalDonation}
              className="flex-1 bg-kb-blue hover:bg-kb-blue/90 text-white"
              disabled={isProcessing || !userData.name.trim() || !userData.email.trim()}
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Donate 20€ via PayPal
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your information is collected for donation purposes only and will not be shared with third parties.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonationModal;
