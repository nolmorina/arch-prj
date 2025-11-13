'use client';

import Image, { type StaticImageData } from "next/image";
import { motion } from "framer-motion";

export type Project = {
  title: string;
  category: string;
  location: string;
  image: StaticImageData;
};

type ProjectCardProps = {
  project: Project;
  index: number;
};

const ProjectCard = ({ project, index }: ProjectCardProps) => (
  <motion.article
    initial={{ opacity: 0, y: 40, rotate: index % 2 === 0 ? -2 : 2 }}
    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{
      duration: 0.9,
      delay: index * 0.08,
      ease: [0.25, 0.1, 0.25, 1]
    }}
    className="group relative flex w-full max-w-[20rem] flex-col items-center"
  >
    <div className="relative aspect-[3/4] w-full overflow-hidden border border-brand-secondary/70 transition duration-300 group-hover:z-10 group-hover:scale-[1.02] group-hover:shadow-card">
      <Image
        src={project.image}
        alt={project.title}
        fill
        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 520px"
        className="object-cover transition duration-500 group-hover:scale-105"
      />
      <span className="absolute left-4 top-4 rounded-full border border-brand-secondary bg-background/80 px-4 py-1 font-condensed text-[0.65rem] uppercase tracking-[0.32em] text-text-muted transition group-hover:border-text group-hover:text-text">
        {project.category}
      </span>
    </div>
    <div className="mt-5 space-y-2 text-center">
      <h3 className="text-lg font-medium uppercase tracking-[0.12em] text-text">
        {project.title}
      </h3>
      <p className="font-condensed text-[0.65rem] uppercase tracking-[0.28em] text-text-muted">
        {project.location}
      </p>
    </div>
  </motion.article>
);

export default ProjectCard;

