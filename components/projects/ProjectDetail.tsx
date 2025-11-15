'use client';

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import type { Project, ProjectGalleryImage } from "@/lib/types/projects";

type ProjectDetailProps = {
  project: Project;
};

const ProjectDetail = ({ project }: ProjectDetailProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setActiveIndex(null), []);

  const showNext = useCallback(() => {
    setActiveIndex((prev) =>
      prev === null ? prev : (prev + 1) % project.gallery.length
    );
  }, [project.gallery.length]);

  const showPrevious = useCallback(() => {
    setActiveIndex((prev) =>
      prev === null
        ? prev
        : (prev - 1 + project.gallery.length) % project.gallery.length
    );
  }, [project.gallery.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowRight") {
        showNext();
      } else if (event.key === "ArrowLeft") {
        showPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, closeLightbox, showNext, showPrevious]);

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col bg-background text-text">
        <section className="relative overflow-hidden pb-24 pt-28">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Link
                href="/#projects"
                className="inline-flex items-center gap-3 rounded-full border border-brand-secondary px-6 py-2 font-condensed text-xs uppercase tracking-[0.28em] text-text-muted transition hover:border-text hover:text-text"
              >
                ← Back to projects
              </Link>
            </motion.div>

            <ProjectHero project={project} />

            <div className="mt-20 grid gap-16 lg:grid-cols-[minmax(280px,320px)_1fr]">
              <ProjectSidebar project={project} />
              <ProjectGallery
                project={project}
                onOpen={setActiveIndex}
              />
            </div>
          </Container>
        </section>
      </main>
      <Footer />

      <Lightbox
        project={project}
        activeIndex={activeIndex}
        onClose={closeLightbox}
        onNext={showNext}
        onPrevious={showPrevious}
      />
    </>
  );
};

export default ProjectDetail;

type ProjectHeroProps = {
  project: Project;
};

const ProjectHero = ({ project }: ProjectHeroProps) => (
  <div className="mt-16 flex flex-col gap-16 lg:flex-row lg:items-start">
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex-1 space-y-6"
    >
      <span className="inline-flex items-center gap-3 rounded-full border border-brand-secondary px-5 py-2 font-condensed text-xs uppercase tracking-[0.28em] text-text-muted">
        {project.category}
      </span>
      <h1 className="mask-reveal text-4xl font-medium uppercase tracking-tightest md:text-5xl lg:text-[3.75rem]">
        <span>{project.title}</span>
      </h1>
      <p className="max-w-2xl text-text-muted md:text-lg">{project.excerpt}</p>
      <div className="flex flex-wrap gap-6 font-condensed text-xs uppercase tracking-[0.28em] text-text-muted">
        <span>{project.location}</span>
        <span>•</span>
        <span>{project.year}</span>
      </div>
    </motion.div>

    <motion.figure
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative h-[22rem] w-full flex-1 overflow-hidden border border-brand-secondary/70 sm:h-[26rem] lg:h-[30rem]"
    >
      <Image
        src={project.heroImage}
        alt={project.heroCaption}
        fill
        priority
        className="object-cover"
        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 640px"
      />
      <figcaption className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background/95 to-transparent px-6 py-5 text-xs uppercase tracking-[0.28em] text-text-muted">
        {project.heroCaption}
      </figcaption>
    </motion.figure>
  </div>
);

type ProjectSidebarProps = {
  project: Project;
};

const ProjectSidebar = ({ project }: ProjectSidebarProps) => (
  <aside className="space-y-16">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className="border border-brand-secondary/70 bg-white px-8 py-10"
    >
      <h2 className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
        Project Information
      </h2>
      <dl className="mt-6 space-y-4 text-sm">
        {project.meta.map((item) => (
          <div
            key={item.label}
            className="flex justify-between gap-6 border-b border-brand-secondary/50 pb-3"
          >
            <dt className="font-condensed text-[0.7rem] uppercase tracking-[0.28em] text-text-muted">
              {item.label}
            </dt>
            <dd className="text-right text-text">{item.value}</dd>
          </div>
        ))}
      </dl>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-8"
    >
      <div className="space-y-4">
        <h3 className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
          Narrative
        </h3>
        <div className="space-y-4 text-sm text-text-muted">
          {project.description.map((paragraph, index) => (
            <p key={`${project.slug}-description-${index}`}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
          Services
        </h3>
        <ul className="space-y-2 text-sm text-text">
          {project.services.map((service) => (
            <li key={service} className="flex items-center gap-3">
              <span className="h-px w-5 bg-brand-secondary" />
              <span>{service}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
          Collaborators
        </h3>
        <ul className="space-y-2 text-sm text-text-muted">
          {project.collaborators.map((collaborator) => (
            <li key={collaborator}>{collaborator}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  </aside>
);

type ProjectGalleryProps = {
  project: Project;
  onOpen: (index: number) => void;
};

const ProjectGallery = ({ project, onOpen }: ProjectGalleryProps) => (
  <div className="relative flex flex-col gap-12">
    <div className="flex items-center justify-between">
      <h2 className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
        Gallery
      </h2>
      <span className="text-xs uppercase tracking-[0.28em] text-text-muted">
        {String(project.gallery.length).padStart(2, "0")} views
      </span>
    </div>

    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      {project.gallery.map((item, index) =>
        index < 4 ? (
          <GalleryItem
            key={`${project.slug}-image-${index}`}
            item={item}
            index={index}
            projectTitle={project.title}
            onOpen={onOpen}
            layout={getLayoutForIndex(index)}
          />
        ) : null
      )}
    </div>

    {project.gallery.length > 4 ? (
      <div className="flex justify-center">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onOpen(0)}
          className="inline-flex items-center justify-center rounded-full border border-text px-12 py-3 font-condensed text-xs uppercase tracking-[0.32em] transition hover:bg-brand-secondary"
        >
          View full gallery
        </motion.button>
      </div>
    ) : null}
  </div>
);

type GalleryItemProps = {
  item: ProjectGalleryImage;
  index: number;
  projectTitle: string;
  onOpen: (index: number) => void;
  layout: GalleryLayout;
};

const GalleryItem = ({
  item,
  index,
  projectTitle,
  onOpen,
  layout
}: GalleryItemProps) => (
  <motion.figure
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.08 }}
    className={`group relative overflow-hidden border border-brand-secondary/70 bg-white ${layout.container}`}
  >
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={`relative block w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-secondary ${layout.aspect}`}
    >
      <Image
        src={item.image}
        alt={`${projectTitle} gallery view ${index + 1}`}
        fill
        className="object-cover transition duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 60vw, 720px"
      />
    </button>
    <figcaption className="flex items-center justify-between px-6 py-5 font-condensed text-[0.7rem] uppercase tracking-[0.28em] text-text-muted">
      <span>{item.caption}</span>
      <span>{String(index + 1).padStart(2, "0")}</span>
    </figcaption>
  </motion.figure>
);

type GalleryLayout = {
  container: string;
  aspect: string;
};

const layoutPresets: GalleryLayout[] = [
  {
    container: "md:col-span-7",
    aspect: "aspect-[5/4] lg:aspect-[4/3]"
  },
  {
    container: "md:col-span-5",
    aspect: "aspect-[3/4] lg:aspect-[2/3]"
  },
  {
    container: "md:col-span-6",
    aspect: "aspect-[16/9]"
  },
  {
    container: "md:col-span-6",
    aspect: "aspect-[4/5]"
  },
  {
    container: "md:col-span-8",
    aspect: "aspect-[5/3]"
  },
  {
    container: "md:col-span-4",
    aspect: "aspect-[3/4]"
  }
];

const getLayoutForIndex = (index: number): GalleryLayout =>
  layoutPresets[index % layoutPresets.length];

type LightboxProps = {
  project: Project;
  activeIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
};

const Lightbox = ({
  project,
  activeIndex,
  onClose,
  onNext,
  onPrevious
}: LightboxProps) => (
  <AnimatePresence>
    {activeIndex !== null ? (
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative flex w-full max-w-5xl flex-col gap-6 bg-background/95 p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <p className="font-condensed text-xs uppercase tracking-[0.32em] text-text-muted">
              {project.title}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-secondary px-4 py-2 font-condensed text-[0.65rem] uppercase tracking-[0.28em] text-text-muted transition hover:border-text hover:text-text"
            >
              Close
            </button>
          </div>
          <div className="relative aspect-[3/2] w-full bg-background-alternate">
            <Image
              src={project.gallery[activeIndex].image}
              alt={`${project.title} expanded view ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 960px"
            />
          </div>
          <div className="flex items-center justify-between font-condensed text-xs uppercase tracking-[0.28em] text-text-muted">
            <span>{project.gallery[activeIndex].caption}</span>
            <span>
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(project.gallery.length).padStart(2, "0")}
            </span>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onPrevious}
              className="rounded-full border border-brand-secondary px-5 py-2 font-condensed text-[0.7rem] uppercase tracking-[0.28em] text-text-muted transition hover:border-text hover:text-text"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-full border border-brand-secondary px-5 py-2 font-condensed text-[0.7rem] uppercase tracking-[0.28em] text-text-muted transition hover:border-text hover:text-text"
            >
              Next
            </button>
          </div>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

