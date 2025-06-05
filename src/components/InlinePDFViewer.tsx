
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
    // Add #view=FitH to make the PDF display properly in iframe
    return `${url}#view=FitH`;
  };

  const openInNewTab = () => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">{document.title}</CardTitle>
          <div className="flex gap-2">
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
        <CardContent className="flex-1 min-h-0 p-6">
          <div className="w-full h-full">
            {document.url ? (
              <iframe
                src={getPDFUrl(document.url)}
                className="w-full h-full rounded-md border"
                title={document.title}
                style={{ minHeight: '500px' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 rounded-md">
                <p className="text-gray-500">No preview available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InlinePDFViewer;
