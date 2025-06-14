
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
    imageUrl:
      "https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Πρότυπα Καταστατικά Σύστασης",
    imageUrl:
      "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Ν. 4601/2019 Μετασχηματισμοί",
    imageUrl:
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=400&q=80",
  },
];

export const FeaturedDocumentsSection: React.FC<FeaturedDocumentsSectionProps> = ({
  documents,
}) => {
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
      <div className="h-20 md:h-24" />
      <div className="w-full border-2 border-kb-blue bg-kb-blue rounded-xl shadow-sm animate-fade-in mb-6">
        <h2 className="text-2xl font-semibold text-white text-center py-4 px-2 m-0">
          Νόμοι Εταιρειών
        </h2>
      </div>
      <div className="flex justify-center w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-[980px] mx-auto w-full">
          {featured.map(({ name, imageUrl, doc }) => (
            <div
              key={name}
              className="bg-white rounded-xl shadow card-hover p-6 flex flex-col items-center border border-gray-100 transition-all w-full"
            >
              <div className="overflow-hidden bg-gray-100 flex items-center justify-center rounded-lg transition-all w-32 h-32 mb-4">
                <img
                  src={imageUrl}
                  alt={name}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
              <div className="text-center flex flex-col flex-1 w-full">
                <h3
                  className="font-bold text-[14px] mb-4 text-kb-darkgray mx-auto w-full line-clamp-2 break-words min-h-[48px] flex items-center justify-center"
                  style={{
                    fontSize: "14px",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
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
                      <Download className="h-6 w-6 md:h-8 md:w-8 mr-2" />
                      Λήψη PDF
                    </a>
                  ) : (
                    <span>
                      <Download className="h-5 w-5 mr-1" />
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
