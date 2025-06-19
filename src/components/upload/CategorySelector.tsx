
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CategorySelectorProps {
  category: string;
  setCategory: (category: string) => void;
  isUploading: boolean;
}

const CATEGORIES = [
  {
    value: "download_example",
    label: "Παραδείγματα Εγγράφων για λήψη (διαθέσιμο μόνο με δωρεά)"
  },
  {
    value: "company_laws",
    label: "Νόμοι Εταιρειών (δωρεάν λήψη)"
  }
];

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  category, 
  setCategory, 
  isUploading 
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Πού θέλετε να ανέβει το έγγραφο;
        <span className="text-red-500 text-base">*</span>
      </label>
      <RadioGroup
        value={category}
        onValueChange={setCategory}
        disabled={isUploading}
        className="flex flex-col gap-3"
      >
        {CATEGORIES.map(option => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value={option.value} id={option.value} disabled={isUploading} />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </RadioGroup>
      {!category && (
        <div className="text-xs text-red-600 mt-1">Παρακαλώ επιλέξτε μία επιλογή</div>
      )}
    </div>
  );
};

export default CategorySelector;
