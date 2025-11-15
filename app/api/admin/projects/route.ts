import { NextResponse } from "next/server";

import {
  createAdminProject,
  fetchAdminProjects
} from "@/lib/server/admin/projectService";
import { getAdminSession } from "@/lib/auth/session";

const handleError = (error: unknown) => {
  console.error("[api/admin/projects] error", error);
  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Unable to process admin projects request."
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

export async function GET() {
  try {
    const unauthorized = await ensureAuthorized();
    if (unauthorized) {
      return unauthorized;
    }
    const data = await fetchAdminProjects();
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST() {
  try {
    const unauthorized = await ensureAuthorized();
    if (unauthorized) {
      return unauthorized;
    }
    const project = await createAdminProject();
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}


