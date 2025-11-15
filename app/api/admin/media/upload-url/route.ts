import { NextResponse } from "next/server";

import { createUploadRequest, type MediaKind } from "@/lib/server/mediaService";
import { getAdminSession } from "@/lib/auth/session";

type UploadUrlBody = {
  projectId?: string;
  contentType?: string;
  fileName?: string;
  kind?: MediaKind;
};

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as UploadUrlBody;
    const { projectId, contentType, fileName, kind = "gallery" } = body ?? {};
    if (!projectId || !contentType) {
      return NextResponse.json(
        { error: "projectId and contentType are required" },
        { status: 400 }
      );
    }

    const data = await createUploadRequest({
      projectId,
      contentType,
      fileName,
      kind
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/admin/media/upload-url] error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create upload URL."
      },
      { status: 500 }
    );
  }
}


