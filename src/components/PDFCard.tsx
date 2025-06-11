
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFCardProps {
  title: string;
  description: string;
  tags: string[];
  category?: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

const PDFCard: React.FC<PDFCardProps> = ({ title, description, tags, category, onView, onEdit, onDelete, isAdmin }) => {
  return (
    <Card className="card-hover card-gradient transition-all duration-200 w-full h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-kb-purple/10 rounded-lg">
            <FileText className="h-5 w-5 text-kb-purple" />
          </div>
          {category && (
            <span className="px-2 py-1 bg-kb-blue text-white text-xs rounded-full font-medium">
              {category}
            </span>
          )}
        </div>
        <h3 className="text-sm font-medium text-kb-darkgray mb-2 line-clamp-2 min-h-[2.5rem] leading-tight">{title}</h3>
        <p className="text-gray-600 text-xs line-clamp-3 mb-3 flex-1 leading-relaxed">{description}</p>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-kb-purple/10 text-kb-purple text-xs rounded-full">
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
          onClick={onView}
        >
          View
        </Button>
        {isAdmin && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
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
  );
};

export default PDFCard;
