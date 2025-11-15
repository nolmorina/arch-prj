import { NextResponse } from "next/server";

import { fetchPublishedProjectBySlug } from "@/lib/projects";

type RouteParams = {
  params: { slug: string };
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const project = await fetchPublishedProjectBySlug(params.slug);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("[api/public/projects/:slug] error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load project."
      },
      { status: 500 }
    );
  }
}


