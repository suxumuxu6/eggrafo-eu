
import React from 'react';
import { Button } from '@/components/ui/button';
import { Document } from '../utils/searchUtils';

const CATEGORIES = [
  'ΥΜΣ',
  'ΠΙΣΤΟΠΟΙΗΤΙΚΑ', 
  'ΑΠΟΓΡΑΦΗ',
  'ΜΕΤΑΒΟΛΕΣ',
  'ΓΝΩΜΟΔΟΤΗΣΕΙΣ Ν.Υ.',
  'Νόμοι'
];

interface CategoryFilterProps {
  documents: Document[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  documents, 
  selectedCategory, 
  onCategoryChange 
}) => {
  const getCategoryCount = (category: string) => {
    if (category === 'all') {
      return documents.length;
    }
    return documents.filter(doc => doc.category === category).length;
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Button
        variant={selectedCategory === 'all' ? 'default' : 'outline'}
        onClick={() => onCategoryChange('all')}
        className={selectedCategory === 'all' ? 'bg-kb-blue hover:bg-kb-blue/90' : ''}
      >
        Όλες ({getCategoryCount('all')})
      </Button>
      {CATEGORIES.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          onClick={() => onCategoryChange(category)}
          className={selectedCategory === category ? 'bg-kb-blue hover:bg-kb-blue/90' : ''}
        >
          {category} ({getCategoryCount(category)})
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
