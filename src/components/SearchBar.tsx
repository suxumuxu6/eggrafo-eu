
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
interface SearchBarProps {
  onSearch: (query: string) => void;
  searchQuery?: string;
}
const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  searchQuery = ''
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Update local state when external searchQuery changes (e.g., when cleared)
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting search for:', localSearchQuery); // DEBUG
    onSearch(localSearchQuery);
  };
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex w-full max-w-3xl items-center space-x-2">
        <Input
          type="text"
          placeholder="Αναζήτηση Εγγράφων..."
          value={localSearchQuery}
          onChange={e => setLocalSearchQuery(e.target.value)}
          className="w-full rounded-xl border-2 border-kb-purple/80 py-4 pl-4 shadow-md focus:border-kb-blue focus:ring-2 focus:ring-kb-blue transition-all
            bg-white
            outline-none
            ring-2 ring-offset-1 ring-kb-purple/20
            focus:outline-none
            hover:border-kb-blue"
          style={{
            borderStyle: 'double',
            borderWidth: '3px'
          }}
        />
        <Button type="submit" className="text-white bg-blue-700 hover:bg-blue-600 h-[50px] rounded-xl px-6 flex items-center transition-all shadow">
          <Search className="h-5 w-5 mr-2" />
          Αναζήτηση
        </Button>
      </div>
    </form>
  );
};
export default SearchBar;
