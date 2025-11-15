import { type StaticImageData } from "next/image";

export type ImageSource = StaticImageData | string;

export type ProjectGalleryImage = {
  image: ImageSource;
  caption: string;
  width?: number;
  height?: number;
};

export type ProjectMeta = {
  label: string;
  value: string;
};

export type Project = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  location: string;
  year: string;
  heroImage: ImageSource;
  heroCaption: string;
  excerpt: string;
  description: string[];
  meta: ProjectMeta[];
  services: string[];
  collaborators: string[];
  gallery: ProjectGalleryImage[];
};


