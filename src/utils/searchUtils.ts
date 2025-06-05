export interface Document {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category?: string;
  url: string;
}

export const searchDocuments = (documents: Document[], query: string): Document[] => {
  if (!query) return documents;

  const normalizedQuery = query.toLowerCase();
  
  return documents.filter(doc => 
    doc.title.toLowerCase().includes(normalizedQuery) || 
    doc.description.toLowerCase().includes(normalizedQuery) ||
    doc.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)) ||
    (doc.category && doc.category.toLowerCase().includes(normalizedQuery))
  );
};
