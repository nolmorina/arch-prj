import { NextResponse } from "next/server";

import {
  registerUploadedAsset,
  type MediaKind
} from "@/lib/server/mediaService";
import { getAdminSession } from "@/lib/auth/session";

type CommitBody = {
  projectId?: string;
  key?: string;
  publicUrl?: string;
  kind?: MediaKind;
  width?: number;
  height?: number;
  fileSize?: number;
  contentType?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as CommitBody;
    const {
      projectId,
      key,
      publicUrl,
      kind = "gallery",
      width,
      height,
      fileSize,
      contentType
    } = body ?? {};

    if (!projectId || !key || !publicUrl || !width || !height || !contentType) {
      return NextResponse.json(
        { error: "Incomplete media payload" },
        { status: 400 }
      );
    }

    const data = await registerUploadedAsset({
      projectId,
      key,
      publicUrl,
      kind,
      width,
      height,
      fileSize,
      contentType
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/admin/media/commit] error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to register uploaded media."
      },
      { status: 500 }
    );
  }
}


