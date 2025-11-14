'use client';

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import Container from "@/components/Container";
import type { Project } from "@/lib/projects";
import ProjectCard from "../ProjectCard";

type ProjectsSectionProps = {
  projects: Project[];
};

const ProjectsSection = ({ projects }: ProjectsSectionProps) => {
  const [visibleCount, setVisibleCount] = useState(3);

  const visibleProjects = useMemo(
    () => projects.slice(0, visibleCount),
    [projects, visibleCount]
  );

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, projects.length));
  };

  const hasMore = visibleCount < projects.length;

  return (
    <section
      id="projects"
      className="relative overflow-hidden bg-background py-24 md:py-32"
    >
      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 text-center"
        >
          <span className="rounded-full border border-brand-secondary px-5 py-2 font-condensed text-xs uppercase tracking-[0.28em] text-text-muted">
            Portfolio
          </span>
          <h2 className="text-4xl font-medium uppercase tracking-tightest text-text md:text-[3rem]">
            Spatial narratives anchored in context.
          </h2>
          <p className="max-w-2xl text-text-muted md:text-lg">
            Each commission is approached as a dialogue between environment and
            geometry—crafted to reveal texture, proportion, and calm.
          </p>
        </motion.div>

        <div className="mt-20 grid justify-items-center gap-14 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>

        {hasMore ? (
          <div className="mt-16 flex justify-center">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={loadMore}
              className="inline-flex items-center justify-center rounded-full border border-text px-12 py-3 font-condensed text-xs uppercase tracking-[0.32em] transition hover:bg-brand-secondary"
            >
              Load more
            </motion.button>
          </div>
        ) : null}
      </Container>

      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <motion.span
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 0.05, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="select-none text-[18vw] font-condensed uppercase tracking-[0.18em] text-text"
          aria-hidden
        >
          Projects
        </motion.span>
      </div>
    </section>
  );
};

export default ProjectsSection;

