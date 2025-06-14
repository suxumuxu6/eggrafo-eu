
import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Document } from "../utils/searchUtils";

interface FeaturedDocumentsSectionProps {
  documents: Document[];
}

const featuredDocs = [
  {
    name: "ν. 4072/2012 Προσωπικές Εταιρείες",
    // White courthouse with columns (law/justice)
    imageUrl: "https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Πρότυπα Καταστατικά Σύστασης",
    // Law books close-up
    imageUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Ν. 4601/2019 Μετασχηματισμοί",
    // Courtroom/judge's gavel - use another suitable "law" image
    imageUrl: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=400&q=80"
  },
];

export const FeaturedDocumentsSection: React.FC<FeaturedDocumentsSectionProps> = ({ documents }) => {
  // Map featured document list to real document objects
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
            <div
              key={name}
              className="bg-white rounded-xl shadow card-hover p-5 flex flex-col items-center border border-gray-100"
            >
              <div className="w-32 h-32 mb-4 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={name}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
              <div className="text-center flex flex-col flex-1 w-full">
                {/* Title: allow up to 2 lines, elide if needed */}
                <h3
                  className="font-bold text-base text-kb-darkgray mb-3 mx-auto w-full
                  line-clamp-2 break-words leading-tight min-h-[48px] flex items-center justify-center"
                  style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}
                  title={name}
                >
                  {name}
                </h3>
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
