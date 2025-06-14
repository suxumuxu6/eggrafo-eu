
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
  {
    name: "Παράδειγμα Τροποποίησης Καταστατικού",
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
      <div className="max-w-5xl mx-auto w-full">
        <div className="w-full border-2 border-kb-blue bg-kb-blue rounded-xl shadow-sm animate-fade-in mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white text-center py-4 px-2 m-0">
            Νόμοι Εταιρειών
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featured.map(({ name, imageUrl, doc }) => {
            const isSpecial = name === "Παράδειγμα Τροποποίησης Καταστατικού";
            return (
              <div
                key={name}
                className={
                  "bg-white rounded-xl shadow card-hover p-5 flex flex-col items-center border border-gray-100 transition-all " +
                  (isSpecial
                    ? "md:col-span-3 lg:col-span-4 row-span-2 w-full min-h-[520px] lg:min-h-[640px] 2xl:min-h-[700px] relative"
                    : "w-full")
                }
                style={
                  isSpecial
                    ? {
                        minHeight: 520,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                      }
                    : undefined
                }
              >
                <div
                  className={
                    "overflow-hidden bg-gray-100 flex items-center justify-center rounded-lg transition-all " +
                    (isSpecial
                      ? "w-64 h-64 lg:w-80 lg:h-80 mb-10 shadow-lg"
                      : "w-32 h-32 mb-4")
                  }
                >
                  <img
                    src={imageUrl}
                    alt={name}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                </div>
                <div className="text-center flex flex-col flex-1 w-full">
                  <h3
                    className={
                      (isSpecial
                        ? "text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-8"
                        : "text-base md:text-lg mb-4 font-bold") +
                      " text-kb-darkgray mx-auto w-full line-clamp-2 break-words min-h-[48px] flex items-center justify-center"
                    }
                    style={{
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
                    className={
                      "flex items-center gap-2 mx-auto mt-auto " +
                      (isSpecial
                        ? "text-2xl md:text-3xl px-16 py-6 lg:px-24 lg:py-8 font-extrabold rounded-lg"
                        : "")
                    }
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
            );
          })}
        </div>
      </div>
    </section>
  );
};
export default FeaturedDocumentsSection;
