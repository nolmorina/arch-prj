import { NextResponse } from "next/server";

import { duplicateAdminProject } from "@/lib/server/admin/projectService";
import { getAdminSession } from "@/lib/auth/session";

type RouteParams = {
  params: { id: string };
};

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const project = await duplicateAdminProject(params.id);
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/projects/:id/duplicate] error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to duplicate project."
      },
      { status: 500 }
    );
  }
}


