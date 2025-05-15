
// Mock search function for documents
// In a real application, this would connect to a backend API or database
export interface Document {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url?: string;
}

// Sample document data
export const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Getting Started Guide',
    description: 'Introduction to our platform and how to get started with the basic features.',
    tags: ['guide', 'introduction', 'basics'],
    url: 'https://www.africau.edu/images/default/sample.pdf',
  },
  {
    id: '2',
    title: 'Advanced Features Tutorial',
    description: 'Deep dive into advanced features and configurations for power users.',
    tags: ['advanced', 'tutorial', 'features'],
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: '3',
    title: 'API Documentation',
    description: 'Complete reference for all API endpoints, parameters, and responses.',
    tags: ['api', 'documentation', 'reference'],
    url: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
  },
  {
    id: '4',
    title: 'Security Best Practices',
    description: 'Guidelines and recommendations for securing your application and data.',
    tags: ['security', 'best practices', 'guidelines'],
  },
  {
    id: '5',
    title: 'Troubleshooting Guide',
    description: 'Common issues and their solutions to help you troubleshoot problems.',
    tags: ['troubleshooting', 'guide', 'issues', 'solutions'],
  },
];

export const searchDocuments = (query: string): Document[] => {
  if (!query) return mockDocuments;

  const normalizedQuery = query.toLowerCase();
  
  return mockDocuments.filter(doc => 
    doc.title.toLowerCase().includes(normalizedQuery) || 
    doc.description.toLowerCase().includes(normalizedQuery) ||
    doc.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
  );
};
