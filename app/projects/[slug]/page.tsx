import { notFound } from "next/navigation";
import type { Metadata } from "next";

import ProjectDetail from "@/components/projects/ProjectDetail";
import { getProjectBySlug, projects } from "@/lib/projects";

type ProjectPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export function generateMetadata({ params }: ProjectPageProps): Metadata {
  const project = getProjectBySlug(params.slug);

  if (!project) {
    return {
      title: "Project — Atelier Forma"
    };
  }

  return {
    title: `${project.title} — Atelier Forma`,
    description: project.excerpt
  };
}

const ProjectPage = ({ params }: ProjectPageProps) => {
  const project = getProjectBySlug(params.slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetail project={project} />;
};

export default ProjectPage;

