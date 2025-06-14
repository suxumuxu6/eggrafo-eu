
import React from 'react';
interface PDFCardProps {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category?: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}
const PDFCard: React.FC<PDFCardProps> = ({
  id,
  title,
  description,
  tags,
  category,
  onView,
  onEdit,
  onDelete,
  isAdmin
}) => {
  const handleCardClick = () => {
    onView();
  };
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  /* Detect if this is the special case */
  const isSpecial = title.trim().toLowerCase() === "παράδειγμα τροποποίησης καταστατικού";
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col border border-gray-100 transition-all card-hover">
      <div className="flex items-center mb-4">
        {/* Removed blue PDF icon from left of title */}
        <h3 className={"font-semibold text-kb-darkgray line-clamp-2 break-words min-h-[40px] flex items-center" + (isSpecial ? " mb-2" : " text-base md:text-lg mb-2")} style={isSpecial ? {
          fontSize: '17px'
        } : undefined} title={title}>
          {title}
        </h3>
      </div>
      {/* PDF PNG Image below the title */}
      <div className="flex justify-center mb-3">
        <img
          src="/lovable-uploads/23947156-2cff-4699-8724-cf7c3852423d.png"
          alt="PDF document"
          className="w-16 h-16 object-contain"
          style={{ marginTop: 0 }}
        />
      </div>
      <p className="text-gray-600 text-sm line-clamp-3 mb-4">{description}</p>
      {tags && tags.length > 0 && <div className="flex flex-wrap mb-4">
        {tags.map((tag, index) => (
          <span key={index} className="bg-gray-200 text-gray-700 rounded-full px-2 py-1 text-xs mr-2 mb-2">
            {tag}
          </span>
        ))}
      </div>}
      <div className="mt-auto">
        <button onClick={handleCardClick} className="bg-kb-blue text-white rounded-md px-4 py-2 hover:bg-kb-blue-dark transition-colors w-full mb-2">Download</button>
        {isAdmin && <div className="flex justify-between">
          <button onClick={e => {
            stopPropagation(e);
            onEdit();
          }} className="text-sm text-blue-500 hover:underline">
            Edit
          </button>
          <button onClick={e => {
            stopPropagation(e);
            onDelete();
          }} className="text-sm text-red-500 hover:underline">
            Delete
          </button>
        </div>}
      </div>
    </div>
  );
};
export default PDFCard;

