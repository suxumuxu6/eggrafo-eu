
import React, { useEffect } from 'react';
import { Document } from '../utils/searchUtils';

interface InlinePDFViewerProps {
  document: Document;
  onClose: () => void;
}

const InlinePDFViewer: React.FC<InlinePDFViewerProps> = ({ document, onClose }) => {
  useEffect(() => {
    // Automatically open the PDF in a new tab when the component mounts
    if (document.url) {
      window.open(document.url, '_blank');
    }
    // Close the modal immediately since we're opening in a new tab
    onClose();
  }, [document.url, onClose]);

  // This component won't render anything visible since it auto-opens and closes
  return null;
};

export default InlinePDFViewer;
