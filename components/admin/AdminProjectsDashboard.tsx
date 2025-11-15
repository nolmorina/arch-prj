'use client';

import type { MutableRefObject, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";

import Container from "@/components/Container";
import type { Project } from "@/lib/types/projects";
import type {
  AdminProjectFormPayload,
  AdminProjectResponse
} from "@/lib/types/admin";
type ImageSource = StaticImageData | string;

type AdminGalleryImage = {
  image: ImageSource;
  caption: string;
  assetId?: string;
  tempId?: string;
  isPending?: boolean;
  width?: number;
  height?: number;
};

type AdminProjectStatus = "draft" | "published" | "archived";

type AdminProjectRecord = Omit<Project, "heroImage" | "gallery"> & {
  heroImage: ImageSource;
  gallery: AdminGalleryImage[];
  id: string;
  status: AdminProjectStatus;
  lastEdited: string;
  heroAssetId?: string;
};

type FormGroupId = "essentials" | "narrative" | "gallery";

type Toast = {
  id: string;
  message: string;
  variant: "success" | "error" | "info";
};

type ValidationResult = Record<string, string>;
type SortOption = "recent" | "alpha";
type PreviewMode = "card" | "hero";
type ActionState = "idle" | "saving" | "publishing";

type FormSectionProps = {
  id: FormGroupId;
  title: string;
  open: boolean;
  onToggle: (group: FormGroupId) => void;
  children: ReactNode;
};

type PendingUploadEntry = {
  file: File;
  previewUrl: string;
  kind: "gallery";
  width?: number;
  height?: number;
};

const META_PRESETS = ["Location", "Year", "Scope", "Size", "Status"];
const MIN_DESCRIPTION_COUNT = 2;
const MIN_META_COUNT = 3;
const MIN_GALLERY_COUNT = 3;
const DEFAULT_GALLERY_TEMPLATE_COUNT = 1;
const MIN_GALLERY_DELETE_THRESHOLD = 1;
const MAX_GALLERY_UPLOAD = 5;
const MAX_GALLERY_COUNT = 15;

const generateId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Math.random().toString(36).slice(2, 10)}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

const formatRelativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  const days = Math.round(hours / 24);
  return `Updated ${days}d ago`;
};

const cloneProject = (project: AdminProjectRecord): AdminProjectRecord => ({
  ...project,
  heroAssetId: project.heroAssetId,
  description: [...project.description],
  meta: project.meta.map((item) => ({ ...item })),
  services: [...project.services],
  collaborators: [...project.collaborators],
  gallery: project.gallery.map((item) => ({ ...item }))
});

const adaptProjectFromApi = (
  project: AdminProjectResponse
): AdminProjectRecord => ({
  ...project,
  heroAssetId: project.heroAssetId,
  heroImage: project.heroImage || "",
  gallery: project.gallery.map((item) => ({
    image: item.src,
    caption: item.caption,
    assetId: item.assetId,
    width: item.width,
    height: item.height
  }))
});

const toApiPayload = (
  record: AdminProjectRecord
): AdminProjectFormPayload => ({
  slug: record.slug,
  title: record.title,
  category: record.category,
  location: record.location,
  year: record.year,
  heroImage: serializeImageSource(record.heroImage),
  heroAssetId: record.heroAssetId,
  heroCaption: record.heroCaption,
  excerpt: record.excerpt,
  description: record.description,
  meta: record.meta.map((item) => ({
    label: item.label,
    value: item.value
  })),
  services: record.services,
  collaborators: record.collaborators,
  gallery: record.gallery.map((item) => ({
    assetId: item.assetId,
    src: serializeImageSource(item.image),
    caption: item.caption,
    width: item.width,
    height: item.height
  }))
});

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? response.statusText);
  }

  return (payload?.data ?? payload) as T;
}

const serializeImageSource = (source: ImageSource) =>
  typeof source === "string" ? source : source.src ?? "";

const projectComparablePayload = (project: AdminProjectRecord) => ({
  slug: project.slug,
  title: project.title,
  category: project.category,
  location: project.location,
  year: project.year,
  heroCaption: project.heroCaption,
  heroImage: serializeImageSource(project.heroImage),
  heroAssetId: project.heroAssetId,
  excerpt: project.excerpt,
  description: project.description,
  meta: project.meta,
  services: project.services,
  collaborators: project.collaborators,
  gallery: project.gallery.map((item) => ({
    assetId: item.assetId,
    caption: item.caption,
    image: serializeImageSource(item.image)
  }))
});

const areProjectsEqual = (
  a: AdminProjectRecord | undefined,
  b: AdminProjectRecord | undefined
) => {
  if (!a || !b) return false;
  return (
    JSON.stringify(projectComparablePayload(a)) ===
    JSON.stringify(projectComparablePayload(b))
  );
};

const validateProject = (
  draft: AdminProjectRecord,
  records: AdminProjectRecord[]
): ValidationResult => {
  const errors: ValidationResult = {};

  if (!draft.title.trim()) {
    errors.title = "Title is required";
  } else if (draft.title.length > 120) {
    errors.title = "Max 120 characters";
  }

  if (!draft.slug.trim()) {
    errors.slug = "Slug is required";
  } else if (!/^[a-z0-9-]+$/.test(draft.slug)) {
    errors.slug = "Use lowercase letters, numbers, and hyphens";
  } else if (
    records.some(
      (record) => record.slug === draft.slug && record.id !== draft.id
    )
  ) {
    errors.slug = "Slug must be unique";
  }

  if (!draft.category.trim()) {
    errors.category = "Category is required";
  }

  if (!draft.location.trim()) {
    errors.location = "Location is required";
  }

  if (!draft.year.trim()) {
    errors.year = "Year is required";
  } else if (!/^(19|20|21)\d{2}(-\d{2})?$/.test(draft.year.trim())) {
    errors.year = "Use YYYY or YYYY-YY";
  }

  if (!draft.heroCaption.trim()) {
    errors.heroCaption = "Provide a hero caption";
  } else if (draft.heroCaption.length > 140) {
    errors.heroCaption = "Caption max is 140 characters";
  }

  if (!draft.excerpt.trim()) {
    errors.excerpt = "Excerpt is required";
  } else if (draft.excerpt.length > 360) {
    errors.excerpt = "Excerpt max is 360 characters";
  }

  if (draft.description.length < MIN_DESCRIPTION_COUNT) {
    errors.description = "Provide at least two paragraphs";
  } else if (draft.description.some((paragraph) => paragraph.trim().length < 80)) {
    errors.description = "Each paragraph should be at least 80 characters";
  }

  if (draft.meta.length < MIN_META_COUNT) {
    errors.meta = "Enter at least three meta rows";
  } else {
    const labels = draft.meta.map((item) => item.label.trim().toLowerCase());
    const hasDuplicate = labels.some(
      (label, index) => label && labels.indexOf(label) !== index
    );
    if (hasDuplicate) {
      errors.meta = "Meta labels must be unique";
    }
    if (draft.meta.some((item) => !item.label.trim() || !item.value.trim())) {
      errors.meta = "Meta requires both label and value";
    }
  }

  if (!draft.services.length) {
    errors.services = "List at least one service";
  }

  if (!draft.collaborators.length) {
    errors.collaborators = "List at least one collaborator";
  }

  if (draft.gallery.length < MIN_GALLERY_COUNT) {
    errors.gallery = "Gallery needs at least three entries";
  } else if (draft.gallery.some((item) => !item.caption.trim())) {
    errors.gallery = "Gallery captions are required";
  }

  return errors;
};

const AdminProjectsDashboard = () => {
  const [records, setRecords] = useState<AdminProjectRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminProjectRecord | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<SortOption>("recent");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("card");
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<FormGroupId, boolean>>({
    essentials: true,
    narrative: true,
    gallery: true
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const draftRef = useRef<AdminProjectRecord | null>(null);
  const pendingUploadsRef = useRef<Record<string, PendingUploadEntry>>({});
  const [deleteTarget, setDeleteTarget] = useState<AdminProjectRecord | null>(
    null
  );

  useEffect(() => {
    return () => {
      Object.values(toastTimers.current).forEach((timer) => {
        clearTimeout(timer);
      });
      Object.values(pendingUploadsRef.current).forEach((entry) => {
        URL.revokeObjectURL(entry.previewUrl);
      });
      pendingUploadsRef.current = {};
    };
  }, []);

  const currentRecord = useMemo(
    () => records.find((record) => record.id === selectedId) ?? null,
    [records, selectedId]
  );

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    Object.values(pendingUploadsRef.current).forEach((entry) => {
      URL.revokeObjectURL(entry.previewUrl);
    });
    pendingUploadsRef.current = {};
  }, [draft?.id]);

  useEffect(() => {
    if (!currentRecord) return;
    setDraft(cloneProject(currentRecord));
    setSlugManuallyEdited(false);
  }, [currentRecord]);

  const isDirty = useMemo(
    () => (currentRecord && draft ? !areProjectsEqual(currentRecord, draft) : false),
    [currentRecord, draft]
  );

  const validationErrors = useMemo(
    () => (draft ? validateProject(draft, records) : {}),
    [draft, records]
  );

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(records.map((record) => record.category).filter(Boolean))
    );
    return ["All", ...unique];
  }, [records]);

  const filteredProjects = useMemo(() => {
    let list = [...records];
    if (categoryFilter !== "All") {
      list = list.filter((record) => record.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (record) =>
          record.title.toLowerCase().includes(query) ||
          record.location.toLowerCase().includes(query)
      );
    }
    if (sortOrder === "recent") {
      list.sort(
        (a, b) =>
          new Date(b.lastEdited).getTime() -
          new Date(a.lastEdited).getTime()
      );
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [records, categoryFilter, searchQuery, sortOrder]);

  const categorySuggestions = useMemo(
    () =>
      Array.from(
        new Set(records.map((record) => record.category).filter(Boolean))
      ),
    [records]
  );

  const handleGroupChange = (
    group: FormGroupId,
    updater: (data: AdminProjectRecord) => AdminProjectRecord
  ) => {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }
      return cloneProject(updater(prev));
    });
  };

  const handleTitleChange = (value: string) => {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const next: AdminProjectRecord = {
        ...prev,
        title: value,
        slug: slugManuallyEdited ? prev.slug : slugify(value)
      };
      return cloneProject(next);
    });
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }
      return cloneProject({ ...prev, slug: value });
    });
  };

  const handleRegenerateSlug = () => {
    setSlugManuallyEdited(false);
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }
      return cloneProject({ ...prev, slug: slugify(prev.title) });
    });
  };

  const pushToast = (variant: Toast["variant"], message: string) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, variant, message }]);
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      delete toastTimers.current[id];
    }, 4200);
    toastTimers.current[id] = timeout;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = toastTimers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete toastTimers.current[id];
    }
  };

const loadProjects = useCallback(async () => {
  try {
    setIsLoading(true);
    setLoadError(null);
    const list = await request<AdminProjectResponse[]>("/api/admin/projects");
    const formatted = list.map(adaptProjectFromApi);
    setRecords(formatted);
    const first = formatted[0] ?? null;
    setSelectedId(first?.id ?? null);
    setDraft(first ? cloneProject(first) : null);
    setIsHydrated(true);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load projects.";
    setLoadError(message);
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  void loadProjects();
}, [loadProjects]);

const syncRecordIntoState = useCallback(
  (record: AdminProjectRecord, options?: { preserveSlugEditing?: boolean }) => {
    setRecords((prev) => {
      const filtered = prev.filter((item) => item.id !== record.id);
      return [record, ...filtered];
    });
    setSelectedId(record.id);
    setDraft(cloneProject(record));
    if (!options?.preserveSlugEditing) {
      setSlugManuallyEdited(false);
    }
  },
  []
);

  const handleCreateProject = async () => {
    try {
      setActionState("saving");
      const project = await request<AdminProjectResponse>("/api/admin/projects", {
        method: "POST"
      });
      const formatted = adaptProjectFromApi(project);
      syncRecordIntoState(formatted);
      pushToast("info", "Blank project ready to edit.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create project.";
      pushToast("error", message);
    } finally {
      setActionState("idle");
    }
  };

  const handleDuplicateProject = async (record: AdminProjectRecord) => {
    try {
      const duplicated = await request<AdminProjectResponse>(
        `/api/admin/projects/${record.id}/duplicate`,
        { method: "POST" }
      );
      const formatted = adaptProjectFromApi(duplicated);
      syncRecordIntoState(formatted, { preserveSlugEditing: true });
      setSlugManuallyEdited(true);
      pushToast("success", `Duplicated ${record.title}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to duplicate project.";
      pushToast("error", message);
    }
  };

  const handleDeleteProject = (record: AdminProjectRecord) => {
    setDeleteTarget(record);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionState("saving");
      await request(`/api/admin/projects/${deleteTarget.id}`, {
        method: "DELETE"
      });
      let filtered: AdminProjectRecord[] = [];
      setRecords((prev) => {
        filtered = prev.filter((record) => record.id !== deleteTarget.id);
        return filtered;
      });
      if (filtered.length) {
        const next = filtered[0];
        setSelectedId(next.id);
        setDraft(cloneProject(next));
      } else {
        const created = await request<AdminProjectResponse>("/api/admin/projects", {
          method: "POST"
        });
        const formatted = adaptProjectFromApi(created);
        setRecords([formatted]);
        setSelectedId(formatted.id);
        setDraft(cloneProject(formatted));
      }
      setSlugManuallyEdited(false);
      pushToast("success", `Removed ${deleteTarget.title}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete project.";
      pushToast("error", message);
    } finally {
      setDeleteTarget(null);
      setActionState("idle");
    }
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    setActionState("saving");
    try {
      const preparedDraft = (await finalizePendingGallery()) ?? draft;
      const payload = toApiPayload(preparedDraft);
      const updated = await request<AdminProjectResponse>(
        `/api/admin/projects/${preparedDraft.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ project: payload })
        }
      );
      syncRecordIntoState(adaptProjectFromApi(updated));
      pushToast("success", "Draft saved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save draft.";
      pushToast("error", message);
    } finally {
      setActionState("idle");
    }
  };

  const handlePublish = async () => {
    if (!draft) return;
    if (Object.keys(validationErrors).length > 0) {
      pushToast("error", "Resolve validation issues before publishing");
      return;
    }
    setActionState("publishing");
    try {
      const preparedDraft = (await finalizePendingGallery()) ?? draft;
      const payload = toApiPayload(preparedDraft);
      const updated = await request<AdminProjectResponse>(
        `/api/admin/projects/${preparedDraft.id}/publish`,
        {
          method: "POST",
          body: JSON.stringify({ project: payload })
        }
      );
      syncRecordIntoState(adaptProjectFromApi(updated));
      pushToast("success", `${draft.title} published`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to publish project.";
      pushToast("error", message);
    } finally {
      setActionState("idle");
    }
  };

  const toggleGroup = (group: FormGroupId) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleMediaLibrary = () => {
    pushToast("info", "Media library coming soon.");
  };

const handleSetHeroFromGallery = (entry: AdminGalleryImage) => {
    handleGroupChange("essentials", (data) => ({
      ...data,
      heroImage: entry.image,
      heroCaption: entry.caption,
      heroAssetId: entry.assetId ?? data.heroAssetId
    }));
  };

  const uploadPendingFile = useCallback(
    async (
      file: File,
      kind: "hero" | "gallery",
      sizing: { width?: number; height?: number }
    ) => {
      if (!draft) {
        throw new Error("No draft available for upload.");
      }
      const { width, height } =
        sizing.width && sizing.height
          ? { width: sizing.width, height: sizing.height }
          : await readImageDimensions(file);
      const uploadDetails = await request<{
        key: string;
        uploadUrl: string;
        publicUrl: string;
      }>("/api/admin/media/upload-url", {
        method: "POST",
        body: JSON.stringify({
          projectId: draft.id,
          fileName: file.name,
          contentType: file.type,
          kind
        })
      });

      await fetch(uploadDetails.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type
        },
        body: file
      });

      return request<{
        assetId: string;
        publicUrl: string;
        storageKey: string;
        width: number;
        height: number;
      }>("/api/admin/media/commit", {
        method: "POST",
        body: JSON.stringify({
          projectId: draft.id,
          key: uploadDetails.key,
          publicUrl: uploadDetails.publicUrl,
          kind,
            width,
            height,
          fileSize: file.size,
          contentType: file.type
        })
      });
    },
    [draft]
  );

  const finalizePendingGallery = useCallback(async () => {
    if (!draft) {
      return null;
    }

    const pendingEntries = draft.gallery.filter(
      (item) => item.tempId && pendingUploadsRef.current[item.tempId]
    );

    if (!pendingEntries.length) {
      return draft;
    }

    let updated = cloneProject(draft);

    for (let index = 0; index < updated.gallery.length; index++) {
      const entry = updated.gallery[index];
      if (!entry.tempId) continue;
      const pending = pendingUploadsRef.current[entry.tempId];
      if (!pending) continue;
      const previousImage =
        typeof entry.image === "string" ? entry.image : undefined;

      const asset = await uploadPendingFile(pending.file, "gallery", {
        width: pending.width,
        height: pending.height
      });

      updated.gallery[index] = {
        ...entry,
        image: asset.publicUrl,
        assetId: asset.assetId,
        isPending: false,
        tempId: undefined,
        width: asset.width,
        height: asset.height
      };

      URL.revokeObjectURL(pending.previewUrl);
      delete pendingUploadsRef.current[entry.tempId];

      if (previousImage && updated.heroImage === previousImage) {
        updated.heroImage = asset.publicUrl;
        updated.heroAssetId = asset.assetId;
      }
    }

    setDraft(cloneProject(updated));
    return updated;
  }, [draft, uploadPendingFile]);

if (isLoading || !draft) {
  return (
    <div className="relative min-h-screen bg-background text-text">
      <AdminNavBar />
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        {loadError ? (
          <>
            <p className="text-text-muted">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                void loadProjects();
              }}
              className="rounded-full border border-brand-secondary px-6 py-2 font-condensed text-xs uppercase tracking-[0.28em]"
            >
              Retry
            </button>
          </>
        ) : (
          <p className="text-text-muted">Loading projects…</p>
        )}
      </main>
    </div>
  );
}

if (!draft) {
  return null;
}

  return (
    <div className="relative min-h-screen bg-background text-text">
      <AdminNavBar />
      <main className="pt-32 pb-24">
        <section className="relative overflow-hidden pb-16">
          <Container>
            <IntroHeader
              onCreateProject={() => {
                void handleCreateProject();
              }}
              projectCount={records.length}
            />
          </Container>
          <span className="pointer-events-none absolute inset-x-0 top-12 -z-10 text-center font-condensed text-[28vw] uppercase tracking-[0.3em] text-brand-secondary/30">
            ADMIN
          </span>
        </section>

        <section className="py-12">
          <Container className="max-w-[min(92vw,78rem)]">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,4.5fr)_minmax(0,7.5fr)]">
              <ProjectListPanel
                projects={filteredProjects}
                categories={categories}
                selectedId={selectedId ?? ""}
                onSelect={setSelectedId}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                categoryFilter={categoryFilter}
                onChangeCategory={setCategoryFilter}
                sortOrder={sortOrder}
                onSort={setSortOrder}
                onCreateProject={() => {
                  void handleCreateProject();
                }}
                onDuplicate={(record) => {
                  void handleDuplicateProject(record);
                }}
                onDelete={handleDeleteProject}
                isHydrated={isHydrated}
              />

              <div className="space-y-10">
                <div className="relative">
                  <ProjectForm
                    draft={draft}
                    openGroups={openGroups}
                    onToggleGroup={toggleGroup}
                    onTitleChange={handleTitleChange}
                    onSlugChange={handleSlugChange}
                    onRegenerateSlug={handleRegenerateSlug}
                    onChange={handleGroupChange}
                    validationErrors={validationErrors}
                    categorySuggestions={categorySuggestions}
                    onRequestMediaLibrary={handleMediaLibrary}
                    onSetHeroFromGallery={handleSetHeroFromGallery}
                    onPushToast={pushToast}
                    pendingUploads={pendingUploadsRef}
                  />

                  <ActionBar
                    status={actionState}
                    isDirty={isDirty}
                    canPublish={Object.keys(validationErrors).length === 0}
                    currentStatus={draft.status}
                    onSaveDraft={() => {
                      void handleSaveDraft();
                    }}
                    onPublish={() => {
                      void handlePublish();
                    }}
                    onDelete={() => {
                      if (draft) {
                        handleDeleteProject(draft);
                      }
                    }}
                  />
                </div>

                <PreviewStrip
                  project={draft}
                  mode={previewMode}
                  onModeChange={setPreviewMode}
                />
              </div>
            </div>
          </Container>
        </section>
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <DeleteConfirmModal
        project={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AdminProjectsDashboard;

type AdminImageProps = {
  source: ImageSource;
  alt: string;
  sizes?: string;
  className?: string;
};

const AdminImage = ({
  source,
  alt,
  sizes,
  className = ""
}: AdminImageProps) => {
  if (!source || (typeof source === "string" && !source.trim())) {
    return (
      <div
        className={`absolute inset-0 flex h-full w-full items-center justify-center bg-background text-xs uppercase tracking-[0.28em] text-text-muted ${className}`.trim()}
        aria-label="Pending image"
      >
        Image pending
      </div>
    );
  }

  return typeof source === "string" ? (
    <img
      src={source}
      alt={alt}
      className={`absolute inset-0 h-full w-full object-cover ${className}`.trim()}
    />
  ) : (
    <Image
      src={source}
      alt={alt}
      fill
      sizes={sizes}
      className={`object-cover ${className}`.trim()}
    />
  );
};

type IntroHeaderProps = {
  onCreateProject: () => void;
  projectCount: number;
};

const IntroHeader = ({ onCreateProject, projectCount }: IntroHeaderProps) => (
  <div className="rounded-[40px] border border-brand-secondary/70 bg-white/90 px-8 py-14 shadow-sm backdrop-blur">
    <div className="flex flex-wrap items-center gap-4 font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
      <span className="rounded-full border border-brand-secondary px-4 py-1">
        Projects Admin
      </span>
      <span>{projectCount} Active entries</span>
    </div>
    <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-5 md:max-w-2xl">
        <h1 className="text-4xl font-medium uppercase tracking-tightest md:text-[3rem]">
          Curate the portfolio
        </h1>
        <p className="text-lg text-text-muted">
          Drafts update only when you save. Publishing pushes the selected
          project to the live grid and detail route.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreateProject}
        className="inline-flex items-center justify-center rounded-full border border-text px-10 py-3 font-condensed text-xs uppercase tracking-[0.32em] transition hover:bg-brand-secondary"
      >
        Create project
      </button>
    </div>
  </div>
);

type ProjectListPanelProps = {
  projects: AdminProjectRecord[];
  categories: string[];
  selectedId: string;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearch: (value: string) => void;
  categoryFilter: string;
  onChangeCategory: (value: string) => void;
  sortOrder: SortOption;
  onSort: (value: SortOption) => void;
  onCreateProject: () => void;
  onDuplicate: (record: AdminProjectRecord) => void;
  onDelete: (record: AdminProjectRecord) => void;
  isHydrated: boolean;
};

const ProjectListPanel = ({
  projects,
  categories,
  selectedId,
  onSelect,
  searchQuery,
  onSearch,
  categoryFilter,
  onChangeCategory,
  sortOrder,
  onSort,
  onCreateProject,
  onDuplicate,
  onDelete,
  isHydrated
}: ProjectListPanelProps) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleCardActivate = (projectId: string) => {
    onSelect(projectId);
    setActiveMenuId(null);
  };

  return (
    <aside className="flex min-h-0 max-h-[80vh] w-full flex-col gap-4 overflow-hidden rounded-[28px] border border-brand-secondary/70 bg-white/85 p-5 backdrop-blur lg:self-start">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search title or location"
          className="flex-1 rounded-full border border-brand-secondary/70 px-4 py-2 text-sm font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
        />
        <button
          type="button"
          onClick={onCreateProject}
          className="rounded-full border border-text px-5 py-2 font-condensed text-[0.7rem] uppercase tracking-[0.28em] transition hover:bg-brand-secondary"
        >
          New
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onChangeCategory(category)}
            className={`rounded-full border px-4 py-1 font-condensed text-[0.65rem] uppercase tracking-[0.28em] transition ${
              categoryFilter === category
                ? "border-text bg-text text-white"
                : "border-brand-secondary text-text-muted hover:border-text hover:text-text"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-text-muted">
        <span>{projects.length} results</span>
        <label className="flex items-center gap-2">
          Sort
          <select
            value={sortOrder}
            onChange={(event) => onSort(event.target.value as SortOption)}
            className="rounded-full border border-brand-secondary px-3 py-1 text-[0.65rem] uppercase tracking-[0.28em]"
          >
            <option value="recent">Newest</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </label>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-secondary/60 p-6 text-center text-sm text-text-muted">
            No projects match the filter. Create a new entry to get started.
          </div>
        ) : (
          projects.map((project) => {
            const isActive = project.id === selectedId;
            return (
              <div
                key={project.id}
                className={`group rounded-3xl border px-5 py-4 transition ${
                  isActive
                    ? "border-text bg-background"
                    : "border-brand-secondary/70 bg-white/70 hover:border-text/70"
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  className="flex w-full cursor-pointer items-start justify-between gap-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-secondary"
                  onClick={() => handleCardActivate(project.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleCardActivate(project.id);
                    }
                  }}
                >
                  <div className="space-y-2">
                    <span className="rounded-full border border-brand-secondary px-3 py-1 font-condensed text-[0.6rem] uppercase tracking-[0.28em] text-text-muted">
                      {project.category}
                    </span>
                    <div>
                      <p className="text-lg font-semibold uppercase tracking-[0.12em]">
                        {project.title}
                      </p>
                      <p className="font-condensed text-[0.65rem] uppercase tracking-[0.28em] text-text-muted">
                        {project.location} — {project.year}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-[0.6rem] uppercase tracking-[0.28em] ${
                        project.status === "published"
                          ? "border-brand-accent text-text"
                          : "border-brand-secondary text-text-muted"
                      }`}
                    >
                      {project.status}
                    </span>
                    <p className="text-[0.65rem] text-text-muted">
                      {isHydrated
                        ? formatRelativeTime(project.lastEdited)
                        : "—"}
                    </p>
                    <div className="relative">
                      <button
                        type="button"
                        aria-label="Project actions"
                        className="rounded-full border border-brand-secondary px-3 py-1 text-[0.65rem]"
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveMenuId((prev) =>
                            prev === project.id ? null : project.id
                          );
                        }}
                      >
                        ⋯
                      </button>
                      <AnimatePresence>
                        {activeMenuId === project.id ? (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                            className="absolute right-0 z-20 mt-2 w-40 rounded-2xl border border-brand-secondary/70 bg-white shadow-card"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onDuplicate(project);
                                setActiveMenuId(null);
                              }}
                              className="block w-full border-b border-brand-secondary/40 px-4 py-2 text-left text-sm text-text hover:bg-background-alternate"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDelete(project);
                                setActiveMenuId(null);
                              }}
                              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-background-alternate"
                            >
                              Delete
                            </button>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

type ProjectFormProps = {
  draft: AdminProjectRecord;
  openGroups: Record<FormGroupId, boolean>;
  onToggleGroup: (group: FormGroupId) => void;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onRegenerateSlug: () => void;
  onChange: (
    group: FormGroupId,
    updater: (draft: AdminProjectRecord) => AdminProjectRecord
  ) => void;
  validationErrors: ValidationResult;
  categorySuggestions: string[];
  onRequestMediaLibrary: () => void;
  onSetHeroFromGallery: (entry: AdminGalleryImage) => void;
  onPushToast: (variant: Toast["variant"], message: string) => void;
  pendingUploads: MutableRefObject<Record<string, PendingUploadEntry>>;
};

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
]);

const readImageDimensions = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = document.createElement("img");
    image.onload = () => {
      const { width, height } = image;
      URL.revokeObjectURL(image.src);
      resolve({ width, height });
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(image.src);
      reject(error);
    };
    image.src = URL.createObjectURL(file);
  });

const deriveCaptionFromFile = (fileName: string, fallbackIndex: number) => {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  if (base) {
    return base;
  }
  return `Uploaded image ${fallbackIndex}`;
};

const ProjectForm = ({
  draft,
  openGroups,
  onToggleGroup,
  onTitleChange,
  onSlugChange,
  onRegenerateSlug,
  onChange,
  validationErrors,
  categorySuggestions,
  onRequestMediaLibrary,
  onSetHeroFromGallery,
  onPushToast,
  pendingUploads
}: ProjectFormProps) => {
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [metaPreset, setMetaPreset] = useState(META_PRESETS[0]);
  const [serviceInput, setServiceInput] = useState("");
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const remainingGallerySlots = Math.max(
    MAX_GALLERY_COUNT - draft.gallery.length,
    0
  );

  const addParagraph = () => {
    onChange("narrative", (data) => ({
      ...data,
      description: [...data.description, ""]
    }));
  };

  const removeParagraph = (index: number) => {
    if (draft.description.length <= MIN_DESCRIPTION_COUNT) return;
    onChange("narrative", (data) => ({
      ...data,
      description: data.description.filter((_, idx) => idx !== index)
    }));
  };

  const addMetaRow = (preset?: string) => {
    onChange("narrative", (data) => ({
      ...data,
      meta: [
        ...data.meta,
        { label: preset ?? "Label", value: "" }
      ]
    }));
  };

  const removeMetaRow = (index: number) => {
    if (draft.meta.length <= MIN_META_COUNT) return;
    onChange("narrative", (data) => ({
      ...data,
      meta: data.meta.filter((_, idx) => idx !== index)
    }));
  };

  const addService = () => {
    if (!serviceInput.trim()) return;
    onChange("narrative", (data) => ({
      ...data,
      services: [...data.services, serviceInput.trim()]
    }));
    setServiceInput("");
  };

  const addCollaborator = () => {
    if (!collaboratorInput.trim()) return;
    onChange("narrative", (data) => ({
      ...data,
      collaborators: [...data.collaborators, collaboratorInput.trim()]
    }));
    setCollaboratorInput("");
  };

  const releasePendingPreview = (entry: AdminGalleryImage) => {
    if (entry.tempId && pendingUploads.current[entry.tempId]) {
      URL.revokeObjectURL(pendingUploads.current[entry.tempId].previewUrl);
      delete pendingUploads.current[entry.tempId];
    } else if (
      typeof entry.image === "string" &&
      entry.image.startsWith("blob:")
    ) {
      URL.revokeObjectURL(entry.image);
    }
  };

  const handleGalleryUpload = async (fileList: FileList | null) => {
    if (!fileList || isUploadingMedia) return;
    let remainingSlots = MAX_GALLERY_COUNT - draft.gallery.length;
    if (remainingSlots <= 0) {
      onPushToast("error", "Gallery is full.");
      return;
    }

    setIsUploadingMedia(true);
    const files = Array.from(fileList).slice(0, MAX_GALLERY_UPLOAD);

    let queued = 0;
    for (const file of files) {
      if (remainingSlots <= 0) {
        onPushToast("info", "Some files were skipped because the gallery is full.");
        break;
      }

      if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
        onPushToast("error", `${file.name} is not a supported image type.`);
        return;
      }

      const tempId = generateId();
      const previewUrl = URL.createObjectURL(file);
      let metadata: { width?: number; height?: number } = {};
      if (typeof window !== "undefined" && "createImageBitmap" in window) {
        try {
          const bitmap = await createImageBitmap(file);
          metadata = { width: bitmap.width, height: bitmap.height };
          bitmap.close();
        } catch {
          // fallback to later calculation
        }
      }

      pendingUploads.current[tempId] = {
        file,
        previewUrl,
        kind: "gallery",
        width: metadata.width,
        height: metadata.height
      };

      let added = false;
      onChange("gallery", (data) => {
        if (data.gallery.length >= MAX_GALLERY_COUNT) {
          URL.revokeObjectURL(previewUrl);
          delete pendingUploads.current[tempId];
          return data;
        }
        return {
          ...data,
          gallery: [
            ...data.gallery,
            {
              image: previewUrl,
              caption: deriveCaptionFromFile(file.name, data.gallery.length + 1),
              assetId: undefined,
              tempId,
              isPending: true,
              width: metadata.width,
              height: metadata.height
            }
          ]
        };
      });
      if (pendingUploads.current[tempId]) {
        added = true;
      }
      if (added) {
        queued += 1;
        remainingSlots -= 1;
      }
    }

    if (queued > 0) {
      onPushToast("info", "Images queued. Save changes to upload.");
    }

    setIsUploadingMedia(false);
  };

  const triggerGalleryUpload = () => {
    if (remainingGallerySlots > 0) {
      galleryInputRef.current?.click();
    }
  };

  const removeGalleryItem = (index: number) => {
    if (draft.gallery.length <= MIN_GALLERY_DELETE_THRESHOLD) return;
    const entry = draft.gallery[index];
    if (entry) {
      releasePendingPreview(entry);
    }
    onChange("gallery", (data) => ({
      ...data,
      gallery: data.gallery.filter((_, idx) => idx !== index)
    }));
  };

  const moveGalleryItem = (from: number, to: number) => {
    if (to < 0 || to >= draft.gallery.length) return;
    onChange("gallery", (data) => {
      const next = [...data.gallery];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return { ...data, gallery: next };
    });
  };

  const renderFieldError = (key: string) =>
    validationErrors[key] ? (
      <p className="text-sm text-red-600">{validationErrors[key]}</p>
    ) : null;

  return (
    <form className="space-y-8" onSubmit={(event) => event.preventDefault()}>
      <FormSection
        id="essentials"
        title="Essentials"
        open={openGroups.essentials}
        onToggle={onToggleGroup}
      >
        <div className="space-y-4">
          <label className="block text-sm font-semibold uppercase tracking-[0.24em]">
            Title
            <input
              type="text"
              value={draft.title}
              onChange={(event) => onTitleChange(event.target.value)}
              maxLength={120}
              className="mt-2 w-full rounded-none border border-brand-secondary/70 px-4 py-2 text-base font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
            />
            <div className="mt-1 flex justify-between text-xs text-text-muted">
              <span className="font-normal normal-case tracking-normal">
                Primary heading
              </span>
              <span className="font-normal normal-case tracking-normal">
                {draft.title.length}/120
              </span>
            </div>
            {renderFieldError("title")}
          </label>

          <label className="block text-sm font-semibold uppercase tracking-[0.24em]">
            Slug
            <div className="mt-2 flex items-center gap-3">
              <input
                type="text"
                value={draft.slug}
                onChange={(event) => onSlugChange(event.target.value)}
                className="flex-1 rounded-none border border-brand-secondary/70 px-4 py-2 text-base font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
              />
              <button
                type="button"
                onClick={onRegenerateSlug}
                className="rounded-full border border-brand-secondary px-4 py-2 text-xs uppercase tracking-[0.28em] text-text-muted transition hover:border-text hover:text-text"
              >
                Auto
              </button>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              <span className="font-normal normal-case tracking-normal">
                Lowercase, hyphenated, unique. Used for /projects/ routes.
              </span>
            </p>
            {renderFieldError("slug")}
          </label>

          <label className="block text-sm font-semibold uppercase tracking-[0.24em]">
            Category
            <input
              list="category-options"
              value={draft.category}
              onChange={(event) =>
                onChange("essentials", (data) => ({
                  ...data,
                  category: event.target.value
                }))
              }
              className="mt-2 w-full rounded-none border border-brand-secondary/70 px-4 py-2 text-base font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
            />
            <datalist id="category-options">
              {categorySuggestions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            {renderFieldError("category")}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold uppercase tracking-[0.24em]">
              Location
              <input
                type="text"
                placeholder="Lisbon, Portugal"
                value={draft.location}
                onChange={(event) =>
                  onChange("essentials", (data) => ({
                    ...data,
                    location: event.target.value
                  }))
                }
                className="mt-2 w-full rounded-none border border-brand-secondary/70 px-4 py-2 text-base font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
              />
              {renderFieldError("location")}
            </label>

            <label className="block text-sm font-semibold uppercase tracking-[0.24em]">
              Year
              <input
                type="text"
                placeholder="2025"
                value={draft.year}
                onChange={(event) =>
                  onChange("essentials", (data) => ({
                    ...data,
                    year: event.target.value
                  }))
                }
                className="mt-2 w-full rounded-none border border-brand-secondary/70 px-4 py-2 text-base font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
              />
              {renderFieldError("year")}
            </label>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="relative h-64 overflow-hidden border border-brand-secondary/70">
                {draft.heroImage ? (
                  <AdminImage
                    source={draft.heroImage}
                    alt={draft.heroCaption}
                    sizes="(max-width: 1024px) 90vw, 480px"
                  />
                ) : null}
                <span className="absolute left-4 top-4 rounded-full border border-brand-secondary bg-white/80 px-3 py-1 font-condensed text-[0.65rem] uppercase tracking-[0.28em] text-text-muted">
                  Hero image
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                <span>3:4 to 4:3 crop, min 2000px wide.</span>
                <button
                  type="button"
                  onClick={onRequestMediaLibrary}
                  className="font-condensed uppercase tracking-[0.28em] text-text"
                >
                  Open library
                </button>
              </div>
            </div>

            <label className="block text-sm font-semibold uppercase tracking-[0.24em]">
              Hero caption
              <textarea
                value={draft.heroCaption}
                maxLength={140}
                onChange={(event) =>
                  onChange("essentials", (data) => ({
                    ...data,
                    heroCaption: event.target.value
                  }))
                }
                className="mt-2 h-32 w-full resize-none rounded-none border border-brand-secondary/70 px-4 py-3 text-base font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
              />
              <div className="mt-1 flex justify-end text-xs text-text-muted">
              <span className="font-normal normal-case tracking-normal">
                {draft.heroCaption.length}/140
              </span>
              </div>
              {renderFieldError("heroCaption")}
            </label>
          </div>

          <label className="block text-sm font-semibold uppercase tracking-[0.24em]">
            Excerpt
            <textarea
              value={draft.excerpt}
              maxLength={360}
              onChange={(event) =>
                onChange("essentials", (data) => ({
                  ...data,
                  excerpt: event.target.value
                }))
              }
              className="mt-2 h-32 w-full resize-none rounded-none border border-brand-secondary/70 px-4 py-3 text-base font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
            />
            <div className="mt-1 flex justify-between text-xs text-text-muted">
              <span className="font-normal normal-case tracking-normal">
                Appears on detail hero + SEO description.
              </span>
              <span className="font-normal normal-case tracking-normal">
                {draft.excerpt.length}/360
              </span>
            </div>
            {renderFieldError("excerpt")}
          </label>
        </div>
      </FormSection>

      <FormSection
        id="narrative"
        title="Narrative & Info"
        open={openGroups.narrative}
        onToggle={onToggleGroup}
      >
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.24em]">
                Description paragraphs
              </p>
              <button
                type="button"
                onClick={addParagraph}
                className="rounded-full border border-brand-secondary px-4 py-1 text-xs uppercase tracking-[0.28em] text-text-muted"
              >
                Add paragraph
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {draft.description.map((paragraph, index) => (
                <div key={index} className="space-y-2">
                  <textarea
                    value={paragraph}
                    onChange={(event) =>
                      onChange("narrative", (data) => {
                        const next = [...data.description];
                        next[index] = event.target.value;
                        return { ...data, description: next };
                      })
                    }
                    className="h-28 w-full resize-none rounded-none border border-brand-secondary/70 px-4 py-3 text-sm font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
                  />
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>Paragraph {index + 1}</span>
                    <button
                      type="button"
                      disabled={draft.description.length <= MIN_DESCRIPTION_COUNT}
                      onClick={() => removeParagraph(index)}
                      className="uppercase tracking-[0.28em] disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {renderFieldError("description")}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em]">
                Meta list
              </p>
              <select
                value={metaPreset}
                onChange={(event) => setMetaPreset(event.target.value)}
                className="rounded-full border border-brand-secondary px-3 py-1 text-[0.7rem] uppercase tracking-[0.28em]"
              >
                {META_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addMetaRow(metaPreset)}
                className="rounded-full border border-brand-secondary px-4 py-1 text-xs uppercase tracking-[0.28em]"
              >
                Add
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {draft.meta.map((item, index) => (
                <div
                  key={`meta-${index}`}
                  className="grid gap-3 rounded-2xl border border-brand-secondary/60 px-4 py-3 sm:grid-cols-[0.9fr_1fr_auto]"
                >
                  <input
                    value={item.label}
                    onChange={(event) =>
                      onChange("narrative", (data) => {
                        const next = data.meta.map((row, idx) =>
                          idx === index
                            ? { ...row, label: event.target.value }
                            : row
                        );
                        return { ...data, meta: next };
                      })
                    }
                    className="rounded-none border border-brand-secondary/60 px-3 py-2 text-sm font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
                    placeholder="Label"
                  />
                  <input
                    value={item.value}
                    onChange={(event) =>
                      onChange("narrative", (data) => {
                        const next = data.meta.map((row, idx) =>
                          idx === index
                            ? { ...row, value: event.target.value }
                            : row
                        );
                        return { ...data, meta: next };
                      })
                    }
                    className="rounded-none border border-brand-secondary/60 px-3 py-2 text-sm font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    disabled={draft.meta.length <= MIN_META_COUNT}
                    onClick={() => removeMetaRow(index)}
                    className="rounded-full border border-brand-secondary px-3 py-2 text-xs uppercase tracking-[0.28em] text-text-muted disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {renderFieldError("meta")}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em]">
                Services
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={serviceInput}
                  onChange={(event) => setServiceInput(event.target.value)}
                  placeholder="Add service"
                  className="flex-1 rounded-none border border-brand-secondary/70 px-3 py-2 text-sm font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addService}
                  className="rounded-full border border-brand-secondary px-4 py-2 text-xs uppercase tracking-[0.28em]"
                >
                  Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {draft.services.map((service, index) => (
                  <span
                    key={`${service}-${index}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-brand-secondary px-4 py-1 text-xs uppercase tracking-[0.28em]"
                  >
                    {service}
                    <button
                      type="button"
                      onClick={() =>
                        onChange("narrative", (data) => ({
                          ...data,
                          services: data.services.filter(
                            (_, idx) => idx !== index
                          )
                        }))
                      }
                      className="text-text-muted"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {renderFieldError("services")}
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em]">
                Collaborators
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={collaboratorInput}
                  onChange={(event) => setCollaboratorInput(event.target.value)}
                  placeholder="Name — Role"
                  className="flex-1 rounded-none border border-brand-secondary/70 px-3 py-2 text-sm font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCollaborator}
                  className="rounded-full border border-brand-secondary px-4 py-2 text-xs uppercase tracking-[0.28em]"
                >
                  Add
                </button>
              </div>
              <div className="mt-3 space-y-2 text-sm text-text-muted">
                {draft.collaborators.map((collaborator, index) => (
                  <div
                    key={`${collaborator}-${index}`}
                    className="flex items-center justify-between rounded-full border border-brand-secondary/60 px-4 py-2"
                  >
                    <span>{collaborator}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onChange("narrative", (data) => ({
                          ...data,
                          collaborators: data.collaborators.filter(
                            (_, idx) => idx !== index
                          )
                        }))
                      }
                      className="text-xs uppercase tracking-[0.28em]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {renderFieldError("collaborators")}
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection
        id="gallery"
        title="Gallery"
        open={openGroups.gallery}
        onToggle={onToggleGroup}
      >
        <div className="space-y-6">
          {draft.gallery.map((item, index) => (
            <div
              key={`${draft.slug}-gallery-${index}`}
              className="grid gap-6 rounded-[28px] border border-brand-secondary/60 p-5 lg:grid-cols-[1fr_1fr]"
            >
              <div className="relative h-60 overflow-hidden border border-brand-secondary/60">
                <AdminImage
                  source={item.image}
                  alt={`${draft.title} gallery ${index + 1}`}
                  sizes="(max-width: 1024px) 90vw, 420px"
                />
                <span className="absolute left-4 top-4 rounded-full border border-brand-secondary/80 bg-white/80 px-3 py-1 font-condensed text-[0.65rem] uppercase tracking-[0.28em] text-text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold uppercase tracking-[0.24em]">
                  Caption
                  {item.isPending ? (
                    <span className="ml-2 text-xs font-normal tracking-[0.28em] text-brand-secondary">
                      Uploads on save
                    </span>
                  ) : null}
                  <textarea
                    value={item.caption}
                    onChange={(event) =>
                      onChange("gallery", (data) => {
                        const next = data.gallery.map((entry, idx) =>
                          idx === index
                            ? { ...entry, caption: event.target.value }
                            : entry
                        );
                        return { ...data, gallery: next };
                      })
                    }
                    className="mt-2 h-24 w-full resize-none rounded-none border border-brand-secondary/60 px-3 py-2 text-sm font-normal placeholder:font-normal placeholder:text-text-muted/60 focus:border-text focus:outline-none"
                  />
                </label>
                <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.28em]">
                  <button
                    type="button"
                    onClick={() => onSetHeroFromGallery(item)}
                    className="rounded-full border border-brand-secondary px-4 py-2"
                  >
                    Set as hero
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGalleryItem(index, index - 1)}
                    className="rounded-full border border-brand-secondary px-3 py-2"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGalleryItem(index, index + 1)}
                    className="rounded-full border border-brand-secondary px-3 py-2"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={draft.gallery.length <= MIN_GALLERY_DELETE_THRESHOLD}
                    onClick={() => removeGalleryItem(index)}
                    className="rounded-full border border-brand-secondary px-4 py-2 disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 text-sm text-text-muted">
              <p>
                {draft.gallery.length}/{MAX_GALLERY_COUNT} images
              </p>
              <p className="text-xs text-text-muted/80">
                Upload up to {MAX_GALLERY_UPLOAD} per batch •{" "}
                {remainingGallerySlots} slots remaining
              </p>
              <p className="text-xs text-text-muted/70">
                Files upload to Cloudflare when you save changes.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  void handleGalleryUpload(event.target.files);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={triggerGalleryUpload}
                disabled={remainingGallerySlots === 0 || isUploadingMedia}
                className="rounded-full border border-text px-5 py-2 font-condensed text-xs uppercase tracking-[0.32em] disabled:opacity-30"
              >
                {isUploadingMedia ? "Processing…" : "Upload images"}
              </button>
            </div>
          </div>
          {renderFieldError("gallery")}
        </div>
      </FormSection>
    </form>
  );
};

const FormSection = ({
  id,
  title,
  open,
  onToggle,
  children
}: FormSectionProps) => (
  <div className="rounded-[32px] border border-brand-secondary/70 bg-white px-6 py-7 md:px-8 md:py-10">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
          {title}
        </p>
        <p className="text-[0.75rem] text-text-muted">Manual save required</p>
      </div>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="rounded-full border border-brand-secondary px-3 py-1 text-xs uppercase tracking-[0.28em] text-text-muted"
      >
        {open ? "Collapse" : "Expand"}
      </button>
    </div>

    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 space-y-6"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  </div>
);

type PreviewStripProps = {
  project: AdminProjectRecord;
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
};

const PreviewStrip = ({ project, mode, onModeChange }: PreviewStripProps) => (
  <div className="rounded-[40px] border border-brand-secondary bg-background-alternate px-6 py-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
          Live preview
        </p>
        <p className="text-sm text-text-muted">
          Mirrors the public ProjectCard and hero summary.
        </p>
      </div>
      <div className="flex rounded-full border border-brand-secondary">
        {(["card", "hero"] as PreviewMode[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onModeChange(option)}
            className={`rounded-full px-4 py-1 font-condensed text-xs uppercase tracking-[0.28em] ${
              mode === option
                ? "bg-text text-white"
                : "text-text-muted hover:text-text"
            }`}
          >
            {option === "card" ? "Card view" : "Detail hero"}
          </button>
        ))}
      </div>
    </div>

    <div className="mt-8">
      {mode === "card" ? (
        <ProjectCardPreview project={project} />
      ) : (
        <ProjectHeroPreview project={project} />
      )}
    </div>

    <p className="mt-6 text-sm text-text-muted">
      Preview respects responsive crop rules; final assets render via shared
      components.
    </p>
  </div>
);

const ProjectCardPreview = ({ project }: { project: AdminProjectRecord }) => {
  const hasTitle = Boolean(project.title?.trim());
  const hasLocation = Boolean(project.location?.trim());
  const hasYear = Boolean(project.year?.trim());
  const hasCategory = Boolean(project.category?.trim());

  return (
    <div className="mx-auto max-w-xs rounded-[28px] border border-brand-secondary/70 bg-white p-4">
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-brand-secondary/60">
        <AdminImage
          source={project.heroImage}
          alt={project.title}
          sizes="200px"
        />
        <span
          className={`absolute left-4 top-4 rounded-full border border-brand-secondary bg-white/80 px-3 py-1 font-condensed text-[0.6rem] uppercase tracking-[0.28em] ${
            hasCategory ? "text-text-muted" : "text-text-muted/70"
          }`}
        >
          {hasCategory ? project.category : "Category"}
        </span>
      </div>
      <div className="mt-4 space-y-2 text-center">
        <p
          className={`text-lg uppercase tracking-[0.12em] ${
            hasTitle ? "font-semibold text-text" : "font-normal text-text-muted"
          }`}
        >
          {hasTitle ? project.title : "Project title"}
        </p>
        <p
          className={`font-condensed text-[0.65rem] uppercase tracking-[0.28em] ${
            hasLocation && hasYear ? "text-text-muted" : "text-text-muted/70"
          }`}
        >
          {hasLocation ? project.location : "Location"} —{" "}
          {hasYear ? project.year : "Year"}
        </p>
      </div>
    </div>
  );
};

const ProjectHeroPreview = ({ project }: { project: AdminProjectRecord }) => {
  const hasCategory = Boolean(project.category?.trim());
  const hasTitle = Boolean(project.title?.trim());
  const hasExcerpt = Boolean(project.excerpt?.trim());
  const hasLocation = Boolean(project.location?.trim());
  const hasYear = Boolean(project.year?.trim());
  const hasCaption = Boolean(project.heroCaption?.trim());

  return (
    <div className="rounded-[32px] border border-brand-secondary bg-white p-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <span
            className={`inline-flex items-center rounded-full border border-brand-secondary px-4 py-1 font-condensed text-[0.65rem] uppercase tracking-[0.28em] ${
              hasCategory ? "text-text-muted" : "text-text-muted/70"
            }`}
          >
            {hasCategory ? project.category : "Category"}
          </span>
          <h3
            className={`text-3xl uppercase tracking-tightest ${
              hasTitle ? "font-medium text-text" : "font-normal text-text-muted"
            }`}
          >
            {hasTitle ? project.title : "Project hero heading"}
          </h3>
          <p
            className={`${
              hasExcerpt ? "text-text-muted" : "text-text-muted/70"
            }`}
          >
            {hasExcerpt ? project.excerpt : "Intro narrative."}
          </p>
          <p
            className={`font-condensed text-xs uppercase tracking-[0.28em] ${
              hasLocation && hasYear ? "text-text-muted" : "text-text-muted/70"
            }`}
          >
            {hasLocation ? project.location : "Location"} •{" "}
            {hasYear ? project.year : "Year"}
          </p>
        </div>
        <div className="relative h-64 flex-1 border border-brand-secondary/70">
          <AdminImage
            source={project.heroImage}
            alt={project.heroCaption}
            sizes="(max-width: 1024px) 90vw, 520px"
          />
          <p
            className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-background/95 to-transparent px-4 py-3 text-xs uppercase tracking-[0.28em] ${
              hasCaption ? "text-text-muted" : "text-text-muted/70"
            }`}
          >
            {hasCaption ? project.heroCaption : "Hero caption"}
          </p>
        </div>
      </div>
    </div>
  );
};

type ActionBarProps = {
  status: ActionState;
  isDirty: boolean;
  canPublish: boolean;
  currentStatus: AdminProjectStatus;
  onSaveDraft: () => void;
  onPublish: () => void;
  onDelete: () => void;
};

const ActionBar = ({
  status,
  isDirty,
  canPublish,
  currentStatus,
  onSaveDraft,
  onPublish,
  onDelete
}: ActionBarProps) => {
  const disabled = status !== "idle";
  const primaryLabel =
    currentStatus === "published" ? "Publish update" : "Publish";
  const saveLabel = currentStatus === "published" ? "Save changes" : "Save draft";

  const renderContent = (buttonClass: string) => (
    <>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-[0.28em] text-text-muted">
          {isDirty ? "Dirty state" : "Synced"}
        </span>
        <span className="text-sm text-text">
          {status === "saving"
            ? "Saving…"
            : status === "publishing"
            ? "Publishing…"
            : isDirty
            ? "Unsaved edits"
            : "Up to date"}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={disabled || !isDirty}
          className={`${buttonClass} border-brand-secondary text-text disabled:opacity-40`}
        >
          {saveLabel}
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={disabled || !canPublish}
          className={`${buttonClass} border-text text-text disabled:opacity-40`}
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={`${buttonClass} border-red-400 text-red-600`}
        >
          Delete
        </button>
      </div>
    </>
  );

  return (
    <div className="mt-6 rounded-[32px] border border-brand-secondary/70 bg-white px-6 py-7 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {renderContent(
          "rounded-full border px-6 py-2 font-condensed text-xs uppercase tracking-[0.28em]"
        )}
      </div>
    </div>
  );
};

type ToastStackProps = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

const ToastStack = ({ toasts, onDismiss }: ToastStackProps) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm text-white ${
            toast.variant === "success"
              ? "border-green-400 bg-green-500/90"
              : toast.variant === "error"
              ? "border-red-400 bg-red-500/90"
              : "border-brand-secondary bg-text"
          }`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            aria-label="Dismiss toast"
            onClick={() => onDismiss(toast.id)}
          >
            ×
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

type DeleteConfirmModalProps = {
  project: AdminProjectRecord | null;
  onCancel: () => void;
  onConfirm: () => void;
};

const DeleteConfirmModal = ({
  project,
  onCancel,
  onConfirm
}: DeleteConfirmModalProps) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue("");
  }, [project]);

  const disabled = inputValue !== (project?.title ?? "");

  return (
    <AnimatePresence>
      {project ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg rounded-[32px] border border-brand-secondary/70 bg-white p-8 text-center"
          >
            <p className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
              Delete project
            </p>
            <h3 className="mt-4 text-2xl font-semibold uppercase tracking-tightest">
              {project.title}
            </h3>
            <p className="mt-4 text-sm text-text-muted">
              Type the project title to confirm removal. Static exports will be
              regenerated on next publish.
            </p>
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              className="mt-6 w-full rounded-none border border-brand-secondary/70 px-4 py-2 text-base focus:border-text focus:outline-none"
              placeholder={project.title}
            />
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-brand-secondary px-6 py-2 font-condensed text-xs uppercase tracking-[0.32em]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={onConfirm}
                className="rounded-full border border-red-400 px-6 py-2 font-condensed text-xs uppercase tracking-[0.32em] text-red-600 disabled:opacity-40"
              >
                Delete project
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

const AdminNavBar = () => {
  const { data: session, status } = useSession();
  const userName = session?.user?.name;
  const userEmail = session?.user?.email;
  const displayName = userName || userEmail || "Authorized admin";
  const isLoading = status === "loading";

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/admin/sign-in" });
  };

  return (
  <div className="fixed inset-x-0 top-4 z-40">
    <Container>
        <div className="flex flex-col gap-3 rounded-full border border-brand-secondary/70 bg-white/80 px-6 py-4 text-xs shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between md:text-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.24em]">
            Studio Atlas
          </span>
          <span className="rounded-full bg-brand-accent/30 px-3 py-1 font-condensed text-[0.7rem] uppercase tracking-[0.32em] text-text">
            Admin
          </span>
        </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-[0.65rem] uppercase tracking-[0.28em] text-text-muted md:text-right">
            <div className="text-right">
              <p>{isLoading ? "Verifying access…" : "Signed in as"}</p>
              {!isLoading ? (
                <p className="text-text">{displayName}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-brand-secondary px-4 py-1 font-condensed text-[0.65rem] uppercase tracking-[0.28em] text-text transition hover:border-text"
            >
              Sign out
            </button>
          <Link
            href="/"
              className="rounded-full border border-brand-secondary px-4 py-1 font-condensed text-[0.65rem] uppercase tracking-[0.28em] text-text transition hover:border-text"
          >
            Back to site
          </Link>
        </div>
      </div>
    </Container>
  </div>
);
};

