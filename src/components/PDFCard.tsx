
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFCardProps {
  title: string;
  description: string;
  onView: () => void;
}

const PDFCard: React.FC<PDFCardProps> = ({ title, description, onView }) => {
  return (
    <Card className="card-hover card-gradient transition-all duration-200 w-full">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-kb-purple/10 rounded-lg">
            <FileText className="h-6 w-6 text-kb-purple" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-kb-darkgray mb-2">{title}</h3>
        <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
      </CardContent>
      <CardFooter className="border-t bg-gray-50/50 p-4">
        <Button 
          variant="secondary" 
          className="w-full text-white bg-kb-blue hover:bg-kb-blue/90"
          onClick={onView}
        >
          View Document
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PDFCard;
