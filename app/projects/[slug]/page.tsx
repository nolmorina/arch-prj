import { notFound } from "next/navigation";
import type { Metadata } from "next";

import ProjectDetail from "@/components/projects/ProjectDetail";
import {
  fetchPublishedProjectBySlug,
  fetchPublishedProjectSlugs
} from "@/lib/projects";

type ProjectPageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const slugs = await fetchPublishedProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: ProjectPageProps): Promise<Metadata> {
  const project = await fetchPublishedProjectBySlug(params.slug);

  if (!project) {
    return {
      title: "Project — MOR Architecture"
    };
  }

  return {
    title: `${project.title} — MOR Architecture`,
    description: project.excerpt
  };
}

const ProjectPage = async ({ params }: ProjectPageProps) => {
  const project = await fetchPublishedProjectBySlug(params.slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetail project={project} />;
};

export default ProjectPage;

