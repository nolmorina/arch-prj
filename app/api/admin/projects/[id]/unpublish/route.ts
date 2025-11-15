import { NextResponse } from "next/server";

import { unpublishAdminProject } from "@/lib/server/admin/projectService";
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

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const project = await unpublishAdminProject(params.id, body.project);
    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("[api/admin/projects/:id/unpublish] error", error);
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
            : "Unable to unpublish project."
      },
      { status: 500 }
    );
  }
}


