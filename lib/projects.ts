import { cache } from "react";

import { connectToDatabase } from "@/lib/db/connection";
import {
  PublishedProjectModel,
  type PublishedProject
} from "@/lib/models/publishedProject";
import type { Project } from "@/lib/types/projects";
import { resolveMediaUrl } from "@/lib/server/mediaService";

const sortByOrder = <T extends { order?: number }>(
  items?: Iterable<T> | null
) => {
  if (!items) {
    return [];
  }
  return Array.from(items).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

type PublishedProjectSelection = Pick<
  PublishedProject,
  | "projectId"
  | "slug"
  | "title"
  | "categoryLabel"
  | "location"
  | "yearDisplay"
  | "hero"
  | "excerpt"
  | "descriptionBlocks"
  | "meta"
  | "services"
  | "collaborators"
  | "gallery"
>;

const transformPublishedDoc = (
  doc: PublishedProjectSelection
): Project => ({
  id: doc.projectId?.toString(),
  slug: doc.slug,
  title: doc.title,
  category: doc.categoryLabel,
  location: doc.location,
  year: doc.yearDisplay,
  heroImage: resolveMediaUrl(doc.hero?.src ?? ""),
  heroCaption: doc.hero?.caption ?? "",
  excerpt: doc.excerpt,
  description: sortByOrder(doc.descriptionBlocks).map((block) => block.body),
  meta: sortByOrder(doc.meta).map((item) => ({
    label: item.label,
    value: item.value
  })),
  services: sortByOrder(doc.services).map((service) => service.label),
  collaborators: sortByOrder(doc.collaborators).map(
    (collaborator) => collaborator.label
  ),
  gallery: sortByOrder(doc.gallery).map((item) => ({
    image: resolveMediaUrl(item.src),
    caption: item.caption,
    width: item.width ?? undefined,
    height: item.height ?? undefined
  }))
});

export const fetchPublishedProjects = cache(async (): Promise<Project[]> => {
  await connectToDatabase();
  const docs = (await PublishedProjectModel.find({})
    .sort({ publishedAt: -1 })
    .lean()) as unknown as PublishedProjectSelection[];
  return docs.map((doc) => transformPublishedDoc(doc));
});

export const fetchPublishedProjectBySlug = cache(
  async (slug: string): Promise<Project | null> => {
    await connectToDatabase();
    const doc = (await PublishedProjectModel.findOne({ slug }).lean()) as unknown as PublishedProjectSelection | null;
    if (!doc) {
      return null;
    }
    return transformPublishedDoc(doc);
  }
);

export const fetchPublishedProjectSlugs = cache(async (): Promise<string[]> => {
  await connectToDatabase();
  const docs = await PublishedProjectModel.find({}, { slug: 1 })
    .lean()
    .exec();
  return docs.map((doc) => doc.slug);
});

