import React, { useState, useRef } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DonationModal from './DonationModal';

interface PDFCardProps {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category?: string;
  url?: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

const PDFCard: React.FC<PDFCardProps> = ({
  id,
  title,
  description,
  tags,
  category,
  url,
  onView,
  onEdit,
  onDelete,
  isAdmin
}) => {
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const checkPaymentVerification = () => {
    const verifiedPayment = localStorage.getItem('verifiedPayment');
    if (verifiedPayment) {
      const paymentData = JSON.parse(verifiedPayment);
      // Check if payment is verified and not expired (valid for 7 days)
      const isValid = paymentData.verified && Date.now() - paymentData.timestamp < 7 * 24 * 60 * 60 * 1000;
      console.log('[PDFCard]', title, 'Payment verification found:', paymentData, '| isValid:', isValid);
      return isValid;
    }
    console.log('[PDFCard]', title, 'No payment verification found');
    return false;
  };

  // Download PDF directly from a URL
  const triggerDirectDownload = async () => {
    if (!url) {
      console.log('[PDFCard]', title, 'No URL provided for download');
      return;
    }
    setDownloading(true);
    try {
      // Use a hidden anchor for download
      if (downloadLinkRef.current) {
        console.log('[PDFCard]', title, 'Triggering anchor download');
        downloadLinkRef.current.click();
      } else {
        console.log('[PDFCard]', title, 'Download link ref not available');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadClick = () => {
    console.log('[PDFCard]', title, 'Download button clicked. isAdmin:', isAdmin, '| PaymentVerified:', checkPaymentVerification());
    if (isAdmin || checkPaymentVerification()) {
      triggerDirectDownload();
    } else {
      setIsDonationModalOpen(true);
    }
  };

  const handleDonationSuccess = () => {
    setIsDonationModalOpen(false);
    console.log('[PDFCard]', title, 'Donation succeeded, starting download...');
    // After payment, directly download the PDF
    setTimeout(triggerDirectDownload, 300); // Short delay to let modal close
  };

  return (
    <>
      <Card className="card-hover card-gradient transition-all duration-200 w-full h-full flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-[#173c8f]/0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            {category && (
              <span className="px-2 py-1 bg-kb-blue text-white text-xs rounded-full font-medium">
                {category}
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-kb-darkgray mb-2 line-clamp-2 min-h-[2.5rem] leading-tight">
            {title}
          </h3>
          <p className="text-gray-600 text-xs line-clamp-3 mb-3 flex-1 leading-relaxed">
            {description}
          </p>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-kb-purple/10 text-xs rounded-full text-blue-700">
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t bg-gray-50/50 p-3 flex gap-2 mt-auto">
          <Button
            variant="secondary"
            className="flex-1 text-white bg-kb-blue hover:bg-kb-blue/90 text-xs h-8"
            onClick={handleDownloadClick}
            disabled={downloading || !url}
          >
            {downloading ? 'Downloading...' : 'Download'}
          </Button>
          {/* Download anchor (hidden) */}
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            ref={downloadLinkRef}
            style={{ display: 'none' }}
          />
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        onSuccess={handleDonationSuccess}
        documentTitle={title}
        documentId={id}
      />
    </>
  );
};

export default PDFCard;
