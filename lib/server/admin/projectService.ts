import mongoose, { type ClientSession, Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/connection";
import { CategoryModel } from "@/lib/models/category";
import { CollaboratorModel } from "@/lib/models/collaborator";
import { MediaAssetModel } from "@/lib/models/mediaAsset";
import {
  ProjectModel,
  type Project,
  type ProjectDocument,
  newObjectId
} from "@/lib/models/project";
import { ProjectHistoryModel } from "@/lib/models/projectHistory";
import { ProjectVersionModel } from "@/lib/models/projectVersion";
import { PublishedProjectModel } from "@/lib/models/publishedProject";
import { ServiceModel } from "@/lib/models/service";
import type { AdminProjectFormPayload, AdminProjectResponse } from "@/lib/types/admin";
import { normalizeTitle, slugify, tokenize, uniqueStrings } from "@/lib/utils/text";
import { deleteMediaAssetsByIds, resolveMediaUrl } from "@/lib/server/mediaService";

type ProjectLike = ProjectDocument | (Project & { _id: Types.ObjectId });

const SYSTEM_USER_ID = new Types.ObjectId("000000000000000000000000");
const DEFAULT_HERO_IMAGE = "";

const DEFAULT_GALLERY_IMAGES: Array<{ src: string; caption: string }> = [];

const PLACEHOLDER_PARAGRAPH =
  "Begin the narrative by outlining the project intent, material palette, and experiential goals. Replace this placeholder with at least eighty characters describing the spatial approach.";

const PLACEHOLDER_META = [
  { label: "Location", value: "City, Country" },
  { label: "Year", value: new Date().getFullYear().toString() },
  { label: "Scope", value: "Project scope" }
];

const PLACEHOLDER_SERVICE = ["Architecture"];
const PLACEHOLDER_COLLABORATOR = ["Studio Partner — TBD"];

const MEDIA_DIMENSIONS = {
  hero: { width: 3200, height: 2400 },
  gallery: { width: 2400, height: 1600 }
};

class ProjectValidationError extends Error {
  details: string[];

  constructor(details: string[]) {
    super(details.join("; "));
    this.name = "ProjectValidationError";
    this.details = details;
  }
}

const sortByOrder = <T extends { order?: number }>(
  items?: Iterable<T> | null
) => {
  if (!items) {
    return [];
  }
  return Array.from(items).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

type PublishedProjectPayload = {
  projectId: Types.ObjectId;
  slug: string;
  title: string;
  categoryLabel: string;
  location: string;
  yearDisplay: string;
  hero: Project["hero"];
  excerpt: string;
  descriptionBlocks: Array<{ body: string; order: number }>;
  meta: Array<{ label: string; value: string; order: number }>;
  services: Array<{ label: string; order: number }>;
  collaborators: Array<{ label: string; order: number }>;
  gallery: Array<{
    assetId: Types.ObjectId | null | undefined;
    src: string;
    caption: string;
    order: number;
    focalPoint?: { x?: number | null; y?: number | null } | null;
  }>;
  seo: Project["seo"];
  publishedAt: Date;
  syncedAt: Date;
};

const MAX_TRANSACTION_RETRIES = 3;
const TRANSACTION_RETRY_BASE_DELAY_MS = 100;

const getErrorLabels = (error: unknown): string[] => {
  if (!error || typeof error !== "object") {
    return [];
  }
  const labels: string[] = [];
  const { errorLabels, errorLabelSet } = error as {
    errorLabels?: unknown;
    errorLabelSet?: Set<string>;
  };
  if (Array.isArray(errorLabels)) {
    for (const label of errorLabels) {
      if (typeof label === "string") {
        labels.push(label);
      }
    }
  }
  if (errorLabelSet instanceof Set) {
    Array.from(errorLabelSet).forEach((label) => {
      if (typeof label === "string") {
        labels.push(label);
      }
    });
  }
  return labels;
};

const isTransientTransactionError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const labels = getErrorLabels(error);
  if (labels.includes("TransientTransactionError")) {
    return true;
  }
  const code = (error as { code?: number }).code;
  return code === 112;
};

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const runWithTransaction = async <T>(
  operation: (session: ClientSession) => Promise<T>,
  retries = MAX_TRANSACTION_RETRIES
): Promise<T> => {
  await connectToDatabase();
  for (let attempt = 0; attempt < retries; attempt++) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      if (attempt < retries - 1 && isTransientTransactionError(error)) {
        const delay = TRANSACTION_RETRY_BASE_DELAY_MS * 2 ** attempt;
        await wait(delay);
        continue;
      }
      throw error;
    } finally {
      session.endSession();
    }
  }
  throw new Error("Transaction failed after maximum retries");
};

const mediaFormatFromUrl = (url: string) => {
  const match = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : "jpg";
};

const deriveStorageKey = (url: string) => {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.startsWith("/")
      ? parsed.pathname.slice(1)
      : parsed.pathname;
    return pathname || parsed.hostname;
  } catch {
    return url;
  }
};

const ensureMediaAsset = async (
  url: string,
  kind: "hero" | "gallery",
  caption: string,
  session: ClientSession,
  width: number,
  height: number
) => {
  if (!url?.trim()) {
    return null;
  }

  const existing = await MediaAssetModel.findOne({ publicUrl: url })
    .session(session)
    .exec();
  if (existing) {
    return existing;
  }

  const [created] = await MediaAssetModel.create(
    [
      {
        storageKey: deriveStorageKey(url),
        publicUrl: url,
        kind,
        width,
        height,
        format: mediaFormatFromUrl(url),
        fileSizeBytes: 0,
        createdBy: SYSTEM_USER_ID,
        colorPalette: undefined
      }
    ],
    { session }
  );
  return created;
};

const ensureCategory = async (label: string, session: ClientSession) => {
  const slug = slugify(label, 60);
  const existing = await CategoryModel.findOne({ slug })
    .session(session)
    .exec();
  if (existing) {
    return existing._id;
  }

  const [created] = await CategoryModel.create(
    [
      {
        name: label,
        slug,
        sortOrder: 0,
        description: `${label} (auto-generated)`,
        createdBy: SYSTEM_USER_ID
      }
    ],
    { session }
  );
  return created._id;
};

const ensureService = async (label: string, session: ClientSession) => {
  const cleaned = label.trim();
  const slug = slugify(cleaned, 80);
  const existing = await ServiceModel.findOne({ slug })
    .session(session)
    .exec();
  if (existing) {
    return existing._id;
  }
  const [created] = await ServiceModel.create(
    [
      {
        label: cleaned,
        slug,
        description: `${cleaned} (auto-generated)`,
        createdBy: SYSTEM_USER_ID
      }
    ],
    { session }
  );
  return created._id;
};

const parseCollaboratorLabel = (label: string) => {
  const [displayName, organization = ""] = label.split("—").map((part) => part.trim());
  return { displayName, organization };
};

const ensureCollaborator = async (label: string, session: ClientSession) => {
  const { displayName, organization } = parseCollaboratorLabel(label);
  const existing = await CollaboratorModel.findOne({
    displayName,
    organization
  })
    .session(session)
    .exec();
  if (existing) {
    return existing._id;
  }
  const [created] = await CollaboratorModel.create(
    [
      {
        displayName,
        organization,
        roleDefault: "",
        createdBy: SYSTEM_USER_ID
      }
    ],
    { session }
  );
  return created._id;
};

const validateAdminPayload = (
  payload: AdminProjectFormPayload,
  options?: { allowIncompleteMedia?: boolean }
) => {
  const errors: string[] = [];
  if (!payload.title?.trim()) {
    errors.push("Title is required");
  } else if (payload.title.length > 120) {
    errors.push("Title max length is 120 characters");
  }

  if (!payload.slug?.trim()) {
    errors.push("Slug is required");
  } else if (!/^[a-z0-9-]+$/.test(payload.slug)) {
    errors.push("Slug must use lowercase letters, numbers, and hyphen");
  } else if (payload.slug.length > 60) {
    errors.push("Slug max length is 60 characters");
  }

  if (!payload.category?.trim()) {
    errors.push("Category is required");
  }

  if (!payload.location?.trim()) {
    errors.push("Location is required");
  }

  if (!payload.year?.trim()) {
    errors.push("Year is required");
  } else if (!/^(19|20|21)\d{2}(-\d{2})?$/.test(payload.year.trim())) {
    errors.push("Year must match YYYY or YYYY-YY");
  }

  if (!options?.allowIncompleteMedia) {
    if (!payload.heroImage?.trim()) {
      errors.push("Hero image URL is required");
    }

    if (!payload.heroCaption?.trim()) {
      errors.push("Hero caption is required");
    } else if (payload.heroCaption.length > 140) {
      errors.push("Hero caption max length is 140 characters");
    }
  } else if (payload.heroCaption.length > 140) {
    errors.push("Hero caption max length is 140 characters");
  }

  if (!payload.excerpt?.trim()) {
    errors.push("Excerpt is required");
  } else if (payload.excerpt.length > 360) {
    errors.push("Excerpt max length is 360 characters");
  }

  if (payload.description.length < 2) {
    errors.push("Provide at least two description paragraphs");
  } else if (payload.description.some((paragraph) => paragraph.trim().length < 80)) {
    errors.push("Each description paragraph must be at least 80 characters");
  }

  if (payload.meta.length < 3) {
    errors.push("Meta list requires at least three items");
  } else {
    const labels = payload.meta.map((item) => item.label.trim().toLowerCase());
    const hasDuplicate = labels.some(
      (label, idx) => label && labels.indexOf(label) !== idx
    );
    if (hasDuplicate) {
      errors.push("Meta labels must be unique");
    }
    if (payload.meta.some((item) => !item.label.trim() || !item.value.trim())) {
      errors.push("Meta items require label and value");
    }
  }

  if (!payload.services.length) {
    errors.push("Include at least one service");
  }

  if (!payload.collaborators.length) {
    errors.push("Include at least one collaborator");
  }

  if (!options?.allowIncompleteMedia) {
    if (payload.gallery.length < 3) {
      errors.push("Gallery requires at least three images");
    } else if (payload.gallery.length > 15) {
      errors.push("Gallery can include up to fifteen images");
    } else if (payload.gallery.some((item) => !item.src.trim() || !item.caption.trim())) {
      errors.push("Gallery entries require image URL and caption");
    }
  } else if (payload.gallery.length > 15) {
    errors.push("Gallery can include up to fifteen images");
  }

  if (errors.length) {
    throw new ProjectValidationError(errors);
  }
};

const ensureUniqueSlug = async (
  desiredSlug: string,
  session: ClientSession,
  ignoreId?: string
) => {
  const base = slugify(desiredSlug);
  let candidate = base || `project-${Date.now().toString(36)}`;
  let attempt = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await ProjectModel.exists({
      slug: candidate,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {})
    })
      .session(session)
      .lean();
    if (!existing) {
      return candidate;
    }
    candidate = `${base}-${attempt++}`;
  }
};

const buildSearchTokens = (payload: AdminProjectFormPayload) =>
  uniqueStrings([
    ...tokenize(payload.title),
    ...tokenize(payload.category),
    ...tokenize(payload.location),
    ...tokenize(payload.year),
    ...payload.services.flatMap((service) => tokenize(service)),
    ...payload.collaborators.flatMap((collaborator) => tokenize(collaborator)),
    ...payload.meta.flatMap((item) => tokenize(item.value)),
    ...tokenize(payload.excerpt)
  ]);

const projectDocToAdminResponse = (
  doc: ProjectLike
): AdminProjectResponse => {
  const toIso = (value?: Date | string) =>
    value ? new Date(value).toISOString() : new Date().toISOString();

  const description = sortByOrder(doc.descriptionBlocks).map(
    (block) => block.body
  );

  const meta = sortByOrder(doc.meta).map((item) => ({
    label: item.label,
    value: item.value
  }));

  const services = sortByOrder(doc.services).map(
    (service) => service.label
  );

  const collaborators = sortByOrder(doc.collaborators).map(
    (collaborator) => collaborator.label
  );

  const gallery = sortByOrder(doc.gallery).map((item) => ({
    assetId: item.assetId ? item.assetId.toString() : undefined,
    src: resolveMediaUrl(item.src),
    caption: item.caption,
    width: item.width ?? undefined,
    height: item.height ?? undefined
  }));

  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    category: doc.categoryLabel,
    location: doc.location,
    year: doc.yearDisplay,
    heroImage: resolveMediaUrl(doc.hero?.src ?? ""),
    heroAssetId: doc.hero?.assetId ? doc.hero.assetId.toString() : undefined,
    heroCaption: doc.hero?.caption ?? "",
    excerpt: doc.excerpt,
    description,
    meta,
    services,
    collaborators,
    gallery,
    status: doc.status as AdminProjectResponse["status"],
    lastEdited: toIso(doc.updatedAt)
  };
};

const projectToPublishedPayload = (
  project: ProjectDocument
): PublishedProjectPayload => {
  const sortedDescriptions = sortByOrder(project.descriptionBlocks).map((block) => ({
    body: block.body,
    order: block.order
  }));
  const sortedMeta = sortByOrder(project.meta).map((item) => ({
    label: item.label,
    value: item.value,
    order: item.order
  }));
  const sortedServices = sortByOrder(project.services).map((service) => ({
    label: service.label,
    order: service.order
  }));
  const sortedCollaborators = sortByOrder(project.collaborators).map((collaborator) => ({
    label: collaborator.label,
    order: collaborator.order
  }));
  const sortedGallery = sortByOrder(project.gallery).map((item) => ({
    assetId: item.assetId,
    src: item.src,
    caption: item.caption,
    order: item.order,
    focalPoint: item.focalPoint
  }));

  return {
    projectId: project._id,
    slug: project.slug,
    title: project.title,
    categoryLabel: project.categoryLabel,
    location: project.location,
    yearDisplay: project.yearDisplay,
    hero: project.hero,
    excerpt: project.excerpt,
    descriptionBlocks: sortedDescriptions,
    meta: sortedMeta,
    services: sortedServices,
    collaborators: sortedCollaborators,
    gallery: sortedGallery,
    seo: project.seo,
    publishedAt: project.publishedAt ?? new Date(),
    syncedAt: new Date()
  };
};

const upsertPublishedProject = async (
  project: ProjectDocument,
  session: ClientSession
) => {
  const payload = projectToPublishedPayload(project);
  await PublishedProjectModel.findOneAndUpdate(
    { projectId: project._id },
    { $set: payload },
    { upsert: true, session, new: true }
  );
};

const findOrCreateMediaAsset = async (
  assetId: string | undefined,
  fallbackUrl: string,
  kind: "hero" | "gallery",
  caption: string,
  session: ClientSession,
  width: number,
  height: number
) => {
  if (assetId && Types.ObjectId.isValid(assetId)) {
    const existing = await MediaAssetModel.findOne({
      _id: new Types.ObjectId(assetId)
    })
      .session(session)
      .exec();
    if (existing) {
      return existing;
    }
  }
  return ensureMediaAsset(fallbackUrl, kind, caption, session, width, height);
};

const buildContentFromPayload = async (
  payload: AdminProjectFormPayload,
  session: ClientSession
) => {
  const categoryId = await ensureCategory(payload.category, session);
  const heroAsset = await findOrCreateMediaAsset(
    payload.heroAssetId,
    payload.heroImage,
    "hero",
    payload.heroCaption,
    session,
    MEDIA_DIMENSIONS.hero.width,
    MEDIA_DIMENSIONS.hero.height
  );

  const galleryAssets = await Promise.all(
    payload.gallery.map((item) =>
      findOrCreateMediaAsset(
        item.assetId,
        item.src,
        "gallery",
        item.caption,
        session,
        MEDIA_DIMENSIONS.gallery.width,
        MEDIA_DIMENSIONS.gallery.height
      )
    )
  );

  const descriptionBlocks = payload.description.map((body, index) => ({
    _id: newObjectId(),
    body: body.trim(),
    order: index
  }));

  const meta = payload.meta.map((item, index) => ({
    _id: newObjectId(),
    label: item.label.trim(),
    value: item.value.trim(),
    order: index
  }));

  const services = await Promise.all(
    payload.services.map(async (label, index) => {
      const serviceId = await ensureService(label, session);
      return {
        _id: newObjectId(),
        serviceId,
        label,
        order: index
      };
    })
  );

  const collaborators = await Promise.all(
    payload.collaborators.map(async (label, index) => {
      const collaboratorId = await ensureCollaborator(label, session);
      return {
        _id: newObjectId(),
        collaboratorId,
        label,
        order: index
      };
    })
  );

  const gallery = payload.gallery.map((item, index) => {
    const asset = galleryAssets[index];
    return {
      _id: newObjectId(),
      assetId: asset?._id,
      src: asset?.storageKey ?? item.src ?? "",
      caption: item.caption,
      order: index
    };
  });

  const searchTokens = buildSearchTokens(payload);

  return {
    categoryId,
    hero: {
      assetId: heroAsset?._id,
      src: heroAsset?.storageKey ?? payload.heroImage ?? "",
      width: heroAsset?.width ?? 0,
      height: heroAsset?.height ?? 0,
      caption: payload.heroCaption
    },
    descriptionBlocks,
    meta,
    services,
    collaborators,
    gallery,
    searchTokens
  };
};

const createHistoryEntry = async (
  projectId: Types.ObjectId,
  action: "created" | "duplicated" | "saved" | "published" | "deleted",
  session: ClientSession,
  extra?: Partial<{
    fromStatus: Project["status"];
    toStatus: Project["status"];
    summary: string;
    snapshotVersion: number;
  }>
) => {
  await ProjectHistoryModel.create(
    [
      {
        projectId,
        action,
        actorId: SYSTEM_USER_ID,
        fromStatus: extra?.fromStatus,
        toStatus: extra?.toStatus,
        summary: extra?.summary,
        snapshotVersion: extra?.snapshotVersion
      }
    ],
    { session }
  );
};

const recordVersion = async (
  project: ProjectDocument,
  source: "manual-save" | "publish",
  session: ClientSession,
  published: boolean
) => {
  await ProjectVersionModel.create(
    [
      {
        projectId: project._id,
        version: project.revision,
        status: project.status,
        source,
        payload: project.toObject(),
        createdBy: SYSTEM_USER_ID,
        published
      }
    ],
    { session }
  );
};

const collectProjectAssetIds = (project?: ProjectDocument | null) => {
  const hero = project?.hero?.assetId
    ? project.hero.assetId.toString()
    : undefined;
  const gallery =
    project?.gallery
      ?.map((item) => (item.assetId ? item.assetId.toString() : undefined))
      .filter((value): value is string => Boolean(value)) ?? [];
  return { hero, gallery };
};

const diffAssetIds = (
  previous: { hero?: string; gallery: string[] },
  next: { hero?: string; gallery: string[] }
) => {
  const removed: string[] = [];
  if (previous.hero && previous.hero !== next.hero) {
    removed.push(previous.hero);
  }
  const nextGallerySet = new Set(next.gallery);
  previous.gallery.forEach((assetId) => {
    if (!nextGallerySet.has(assetId)) {
      removed.push(assetId);
    }
  });
  return removed;
};

const persistProjectFromPayload = async (
  projectId: string,
  payload: AdminProjectFormPayload,
  status: "draft" | "published"
) => {
  const result = await runWithTransaction(async (session) => {
    validateAdminPayload(payload, { allowIncompleteMedia: status !== "published" });
    const existing = await ProjectModel.findOne({
      _id: projectId,
      deletedAt: null
    })
      .session(session)
      .exec();

    if (!existing) {
      throw new Error("Project not found");
    }

    const slug = await ensureUniqueSlug(payload.slug, session, projectId);
    const content = await buildContentFromPayload(payload, session);
    const now = new Date();
    const previousAssets = collectProjectAssetIds(existing);

    const update = {
      slug,
      title: payload.title,
      titleSort: normalizeTitle(payload.title),
      categoryId: content.categoryId,
      categoryLabel: payload.category,
      location: payload.location,
      yearDisplay: payload.year,
      hero: content.hero,
      excerpt: payload.excerpt,
      descriptionBlocks: content.descriptionBlocks,
      meta: content.meta,
      services: content.services,
      collaborators: content.collaborators,
      gallery: content.gallery,
      searchTokens: content.searchTokens,
      status,
      updatedAt: now,
      updatedBy: SYSTEM_USER_ID,
      ...(status === "published"
        ? {
            publishedAt: now,
            publishedBy: SYSTEM_USER_ID
          }
        : {})
    };

    const project = await ProjectModel.findOneAndUpdate(
      { _id: projectId, deletedAt: null },
      { $set: update, $inc: { revision: 1 } },
      { new: true, session, runValidators: true }
    );

    if (!project) {
      throw new Error("Project not found");
    }

    const action = status === "published" ? "published" : "saved";
    await createHistoryEntry(project._id, action, session, {
      fromStatus: existing.status,
      toStatus: status,
      snapshotVersion: project.revision
    });

    await recordVersion(
      project,
      status === "published" ? "publish" : "manual-save",
      session,
      status === "published"
    );

    if (status === "published") {
      await upsertPublishedProject(project, session);
    }

    const nextAssets = collectProjectAssetIds(project);
    const removedAssetIds = diffAssetIds(previousAssets, nextAssets);

    return {
      project: projectDocToAdminResponse(project),
      removedAssetIds
    };
  });

  if (result.removedAssetIds.length) {
    await deleteMediaAssetsByIds(result.removedAssetIds).catch((error) => {
      console.error("[media] Failed to delete assets", error);
    });
  }

  return result.project;
};

export const fetchAdminProjects = async () => {
  await connectToDatabase();
  const docs = await ProjectModel.find({ deletedAt: null })
    .sort({ updatedAt: -1 })
    .lean();
  return docs.map((doc) => projectDocToAdminResponse(doc as ProjectLike));
};

export const fetchAdminProject = async (projectId: string) => {
  await connectToDatabase();
  const doc = await ProjectModel.findOne({
    _id: projectId,
    deletedAt: null
  })
    .lean()
    .exec();

  if (!doc) {
    return null;
  }

  return projectDocToAdminResponse(doc as ProjectLike);
};

export const createAdminProject = async () => {
  return runWithTransaction(async (session) => {
    const slug = await ensureUniqueSlug(
      `untitled-${Date.now().toString(36)}`,
      session
    );
    const payload: AdminProjectFormPayload = {
      slug,
      title: "Untitled project",
      category: "Unassigned",
      location: "City, Country",
      year: new Date().getFullYear().toString(),
      heroImage: DEFAULT_HERO_IMAGE,
      heroCaption: "Pending hero caption",
      excerpt:
        "Use this space to summarize the commission in a single sentence before replacing this placeholder copy.",
      description: [PLACEHOLDER_PARAGRAPH, PLACEHOLDER_PARAGRAPH],
      meta: PLACEHOLDER_META,
      services: PLACEHOLDER_SERVICE,
      collaborators: PLACEHOLDER_COLLABORATOR,
      gallery: DEFAULT_GALLERY_IMAGES
    };

    const content = await buildContentFromPayload(payload, session);
    const now = new Date();

    const [project] = await ProjectModel.create(
      [
        {
          slug: payload.slug,
          title: payload.title,
          titleSort: normalizeTitle(payload.title),
          categoryId: content.categoryId,
          categoryLabel: payload.category,
          location: payload.location,
          yearDisplay: payload.year,
          status: "draft",
          hero: content.hero,
          excerpt: payload.excerpt,
          descriptionBlocks: content.descriptionBlocks,
          meta: content.meta,
          services: content.services,
          collaborators: content.collaborators,
          gallery: content.gallery,
          searchTokens: content.searchTokens,
          revision: 1,
          createdBy: SYSTEM_USER_ID,
          updatedBy: SYSTEM_USER_ID,
          createdAt: now,
          updatedAt: now
        }
      ],
      { session }
    );

    await createHistoryEntry(project._id, "created", session, {
      toStatus: "draft",
      snapshotVersion: 1
    });

    await recordVersion(project, "manual-save", session, false);

    return projectDocToAdminResponse(project);
  });
};

export const duplicateAdminProject = async (projectId: string) => {
  return runWithTransaction(async (session) => {
    const project = await ProjectModel.findOne({
      _id: projectId,
      deletedAt: null
    })
      .session(session)
      .exec();

    if (!project) {
      throw new Error("Project not found");
    }

    const slug = await ensureUniqueSlug(`${project.slug}-copy`, session);
    const now = new Date();

    const clone = project.toObject();
    clone._id = newObjectId();
    clone.slug = slug;
    clone.title = `${project.title} (Copy)`;
    clone.titleSort = normalizeTitle(clone.title);
    clone.status = "draft";
    clone.revision = 1;
    clone.createdAt = now;
    clone.updatedAt = now;
    clone.publishedAt = undefined;
    clone.publishedBy = undefined;
    clone.updatedBy = SYSTEM_USER_ID;
    clone.createdBy = SYSTEM_USER_ID;
    clone.deletedAt = undefined;
    clone.descriptionBlocks = sortByOrder(clone.descriptionBlocks).map((block, index) => ({
      ...block,
      _id: newObjectId(),
      order: index
    }));
    clone.meta = sortByOrder(clone.meta).map((item, index) => ({
      ...item,
      _id: newObjectId(),
      order: index
    }));
    clone.services = sortByOrder(clone.services).map((item, index) => ({
      ...item,
      _id: newObjectId(),
      order: index
    }));
    clone.collaborators = sortByOrder(clone.collaborators).map((item, index) => ({
      ...item,
      _id: newObjectId(),
      order: index
    }));
    clone.gallery = sortByOrder(clone.gallery).map((item, index) => ({
      ...item,
      _id: newObjectId(),
      order: index
    }));

    const [duplicate] = await ProjectModel.create([clone], { session });

    await createHistoryEntry(duplicate._id, "duplicated", session, {
      fromStatus: "draft",
      toStatus: "draft",
      snapshotVersion: 1
    });

    await recordVersion(duplicate, "manual-save", session, false);

    return projectDocToAdminResponse(duplicate);
  });
};

export const saveAdminProject = (projectId: string, payload: AdminProjectFormPayload) =>
  persistProjectFromPayload(projectId, payload, "draft");

export const publishAdminProject = (
  projectId: string,
  payload: AdminProjectFormPayload
) => persistProjectFromPayload(projectId, payload, "published");

export const deleteAdminProject = async (projectId: string) => {
  const assetIds: string[] = [];

  const response = await runWithTransaction(async (session) => {
    const project = await ProjectModel.findOne({
      _id: projectId,
      deletedAt: null
    })
      .session(session)
      .exec();

    if (!project) {
      throw new Error("Project not found");
    }

    const previousStatus = project.status;
    project.status = "archived";
    project.deletedAt = new Date();
    project.updatedAt = new Date();
    project.updatedBy = SYSTEM_USER_ID;
    await project.save({ session });

    await createHistoryEntry(project._id, "deleted", session, {
      fromStatus: previousStatus,
      toStatus: "archived"
    });

    await PublishedProjectModel.deleteOne({ projectId: project._id }).session(session);

    const collected = collectProjectAssetIds(project);
    if (collected.hero) {
      assetIds.push(collected.hero);
    }
    assetIds.push(...collected.gallery);

    return projectDocToAdminResponse(project);
  });

  if (assetIds.length) {
    await deleteMediaAssetsByIds(assetIds).catch((error) => {
      console.error("[media] Failed to delete assets", error);
    });
  }

  return response;
};

