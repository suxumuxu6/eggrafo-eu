
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import { Document } from '../utils/searchUtils';

interface InlinePDFViewerProps {
  document: Document;
  onClose: () => void;
}

const InlinePDFViewer: React.FC<InlinePDFViewerProps> = ({ document, onClose }) => {
  // Add parameters to the PDF URL to force it to display inline
  const getPDFUrl = (url: string) => {
    if (!url) return '';
    console.log('PDF URL:', url);
    // Add parameters to ensure proper PDF display in iframe
    return `${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`;
  };

  const openInNewTab = () => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <CardTitle className="text-lg font-semibold truncate pr-4">{document.title}</CardTitle>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              className="h-8"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0 relative">
          <div className="w-full h-full">
            {document.url ? (
              <iframe
                src={getPDFUrl(document.url)}
                className="w-full h-full border-0"
                title={document.title}
                style={{ minHeight: '500px' }}
                onLoad={() => console.log('PDF iframe loaded')}
                onError={() => console.log('PDF iframe error')}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <p className="text-gray-500">No preview available</p>
              </div>
            )}
          </div>
          {/* Footer */}
          <div className="absolute bottom-2 right-4 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
            © D. Lamprou
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InlinePDFViewer;
