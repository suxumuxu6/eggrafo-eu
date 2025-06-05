
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Document } from '../utils/searchUtils';

interface InlinePDFViewerProps {
  document: Document;
  onClose: () => void;
}

const InlinePDFViewer: React.FC<InlinePDFViewerProps> = ({ document, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">{document.title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-6">
          <div className="w-full h-full">
            {document.url ? (
              <iframe
                src={document.url}
                className="w-full h-full rounded-md border"
                title={document.title}
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
