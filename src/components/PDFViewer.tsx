
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    description: string;
    url?: string;
  } | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ isOpen, onClose, document }) => {
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{document.title}</DialogTitle>
          <DialogDescription>{document.description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
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
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;
