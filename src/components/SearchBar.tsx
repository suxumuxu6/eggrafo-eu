
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchQuery?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, searchQuery = '' }) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Update local state when external searchQuery changes (e.g., when cleared)
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex w-full max-w-3xl items-center space-x-2">
        <Input
          type="text"
          placeholder="Αναζήτηση Εγγράφων..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          className="w-full rounded-lg border-gray-200 py-3 pl-4 shadow-sm focus:border-kb-purple focus:ring-kb-purple"
        />
        <Button type="submit" className="bg-kb-purple hover:bg-kb-purple/90 text-white">
          <Search className="h-4 w-4 mr-2" />
          Αναζήτηση
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
