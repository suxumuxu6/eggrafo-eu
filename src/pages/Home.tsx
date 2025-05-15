import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import PDFCard from '../components/PDFCard';
import PDFViewer from '../components/PDFViewer';
import { useAuth } from '../context/AuthContext';
import { searchDocuments, Document, mockDocuments } from '../utils/searchUtils';
const Home: React.FC = () => {
  const {
    isAuthenticated
  } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  const handleSearch = (query: string) => {
    const results = searchDocuments(query);
    setDocuments(results);
  };
  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsViewerOpen(true);
  };
  return <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold mb-4 text-kb-darkgray">ΕΒΕΑ ΟΕ/ΕΕ PORTAL</h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">Μέσα στο site μπορείτε βρείτε γνωμοδοτήσεις των νομικών συμβούλων , manuals και άλλα έγγραφα μέσα απο τις κατηγορίες καθώς και την αναζήτηση.</p>
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6 text-kb-darkgray">Available Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map(doc => <PDFCard key={doc.id} title={doc.title} description={doc.description} onView={() => handleViewDocument(doc)} />)}
          </div>
          {documents.length === 0 && <div className="text-center py-12">
              <p className="text-gray-500">No documents found. Try a different search term.</p>
            </div>}
        </div>

        <PDFViewer isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} document={selectedDocument} />
      </main>
    </div>;
};
export default Home;