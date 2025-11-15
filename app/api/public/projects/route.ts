import { NextResponse } from "next/server";

import { fetchPublishedProjects } from "@/lib/projects";

export async function GET() {
  try {
    const projects = await fetchPublishedProjects();
    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error("[api/public/projects] error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load published projects."
      },
      { status: 500 }
    );
  }
}


