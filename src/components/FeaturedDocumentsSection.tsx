
import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Document } from "../utils/searchUtils";

interface FeaturedDocumentsSectionProps {
  documents: Document[];
}

const featuredDocs = [
  {
    name: "ν. 4072/2012 ΠΡΟΣΩΠΙΚΕΣ ΕΜΠΟΡΙΚΕΣ ΕΤΑΙΡΙΕΣ",
    imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=500&q=80"
  },
  {
    name: "Πρότυπα Καταστατικά Σύστασης",
    imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=80"
  },
  {
    name: "Ν. 4601/2019 Μετασχηματισμοί",
    imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=500&q=80"
  },
];

export const FeaturedDocumentsSection: React.FC<FeaturedDocumentsSectionProps> = ({ documents }) => {
  // Try to find the actual document object by name for download URL
  const featured = featuredDocs.map((item) => {
    const match = documents.find(
      (doc) => doc.title.trim().toLowerCase() === item.name.trim().toLowerCase()
    );
    return {
      ...item,
      doc: match,
    };
  });

  return (
    <section className="w-full mb-12">
      <div className="max-w-5xl mx-auto w-full mb-8">
        <h2 className="text-2xl font-semibold text-kb-darkgray mb-4 text-center">
          Επιλεγμένα έγγραφα
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map(({ name, imageUrl, doc }, idx) => (
            <div key={name} className="bg-white rounded-xl shadow card-hover p-5 flex flex-col items-center border border-gray-100">
              <div className="w-32 h-32 mb-4 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={name}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
              <div className="text-center flex flex-col flex-1">
                <h3 className="font-bold text-lg text-kb-darkgray mb-3 truncate">{name}</h3>
                <Button
                  variant="secondary"
                  className="flex items-center gap-2 mx-auto mt-auto"
                  asChild
                  disabled={!doc}
                >
                  {doc ? (
                    <a
                      href={doc.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Λήψη PDF
                    </a>
                  ) : (
                    <span>
                      <Download className="h-4 w-4 mr-1" />
                      Δεν υπάρχει διαθέσιμο
                    </span>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDocumentsSection;

