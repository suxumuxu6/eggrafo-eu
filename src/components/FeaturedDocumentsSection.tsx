
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
      "/lovable-uploads/2a456a05-73e4-4aa4-92d4-b70aaa8bcca6.png",
  },
  // Removed "Πρότυπα Καταστατικά Σύστασης"
  {
    name: "Ν. 4601/2019 Μετασχηματισμοί",
    imageUrl:
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=400&q=80",
  },
  // Added new GE.MH card
  {
    name: "ν. 4919/2022 ΓΕΜΗ",
    imageUrl: "/lovable-uploads/86eecd5e-4f60-42f5-9b4e-1ae0cb5853e3.png",
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
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-3
            gap-8
            max-w-[1100px]
            mx-auto
            w-full
          "
        >
          {featured.map(({ name, imageUrl, doc }) => (
            <div
              key={name}
              className="bg-white rounded-xl shadow card-hover p-8 flex flex-col items-center border border-gray-100 transition-all w-full min-w-[260px] max-w-[340px]"
              style={{
                minHeight: "370px",
              }}
            >
              <div className="overflow-hidden bg-gray-100 flex items-center justify-center rounded-lg transition-all w-36 h-36 mb-5">
                <img
                  src={imageUrl}
                  alt={name}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
              <div className="text-center flex flex-col flex-1 w-full">
                <h3
                  className="font-bold text-[15px] mb-6 text-kb-darkgray mx-auto w-full line-clamp-2 break-words min-h-[48px] flex items-center justify-center"
                  style={{
                    fontSize: "15px",
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
                  className="flex items-center gap-2 mx-auto mt-auto text-base px-6 py-3"
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
                      <Download className="h-6 w-6 md:h-7 md:w-7 mr-2" />
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

