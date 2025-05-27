
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFCardProps {
  title: string;
  description: string;
  tags: string[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

const PDFCard: React.FC<PDFCardProps> = ({ title, description, tags, onView, onEdit, onDelete, isAdmin }) => {
  return (
    <Card className="card-hover card-gradient transition-all duration-200 w-full">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-kb-purple/10 rounded-lg">
            <FileText className="h-6 w-6 text-kb-purple" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-kb-darkgray mb-2">{title}</h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{description}</p>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-kb-purple/10 text-kb-purple text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-gray-50/50 p-4 flex gap-2">
        <Button 
          variant="secondary" 
          className="flex-1 text-white bg-kb-blue hover:bg-kb-blue/90"
          onClick={onView}
        >
          View Document
        </Button>
        {isAdmin && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default PDFCard;
