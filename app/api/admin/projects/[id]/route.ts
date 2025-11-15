import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  deleteAdminProject,
  fetchAdminProject,
  saveAdminProject
} from "@/lib/server/admin/projectService";
import type { AdminProjectFormPayload } from "@/lib/types/admin";
import { getAdminSession } from "@/lib/auth/session";

type RouteParams = {
  params: { id: string };
};

type ValidationError = Error & { details?: string[] };

const isProjectValidationError = (
  error: unknown
): error is ValidationError =>
  error instanceof Error && error.name === "ProjectValidationError";

const handleError = (error: unknown) => {
  console.error("[api/admin/projects/:id] error", error);
  if (isProjectValidationError(error)) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: 400 }
    );
  }
  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Unable to process project request."
    },
    { status: 500 }
  );
};

const ensureAuthorized = async () => {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const unauthorized = await ensureAuthorized();
    if (unauthorized) {
      return unauthorized;
    }
    const project = await fetchAdminProject(params.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ data: project });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const unauthorized = await ensureAuthorized();
    if (unauthorized) {
      return unauthorized;
    }
    const body = (await request.json()) as {
      project: AdminProjectFormPayload;
    };
    if (!body?.project) {
      return NextResponse.json(
        { error: "Missing project payload" },
        { status: 400 }
      );
    }
    const project = await saveAdminProject(params.id, body.project);
    return NextResponse.json({ data: project });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const unauthorized = await ensureAuthorized();
    if (unauthorized) {
      return unauthorized;
    }
    const project = await deleteAdminProject(params.id);
    
    // Revalidate public pages that display projects
    revalidatePath('/');
    revalidatePath('/api/public/projects');
    // Revalidate the individual project page if it was published
    if (project.slug) {
      revalidatePath(`/projects/${project.slug}`);
    }
    
    return NextResponse.json({ data: project });
  } catch (error) {
    return handleError(error);
  }
}


