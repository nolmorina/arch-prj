export type AdminGalleryItem = {
  assetId?: string;
  src: string;
  caption: string;
  width?: number;
  height?: number;
};

export type AdminMetaItem = {
  label: string;
  value: string;
};

export type AdminProjectFormPayload = {
  slug: string;
  title: string;
  category: string;
  location: string;
  year: string;
  heroImage: string;
  heroAssetId?: string;
  heroCaption: string;
  excerpt: string;
  description: string[];
  meta: AdminMetaItem[];
  services: string[];
  collaborators: string[];
  gallery: AdminGalleryItem[];
};

export type AdminProjectResponse = AdminProjectFormPayload & {
  id: string;
  status: "draft" | "published" | "archived";
  lastEdited: string;
};
