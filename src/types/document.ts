
export interface Document {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category?: string;
  url: string;
  view_count?: number;
}

export interface DocumentUpdateData {
  title: string;
  description: string;
  tags: string[];
  category?: string;
}
