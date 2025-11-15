import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";

import { getR2Bucket, getR2Client } from "@/lib/server/r2";

const toWebReadableStream = (body: unknown) => {
  if (!body) {
    return null;
  }
  if (body instanceof Readable) {
    return Readable.toWeb(body);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (body as any).toWeb === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (body as any).toWeb();
  }
  return body as ReadableStream<Uint8Array>;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const encodedKey = searchParams.get("key");
  const key = encodedKey ? decodeURIComponent(encodedKey) : null;
  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }

  try {
    const client = getR2Client();
    const bucket = getR2Bucket();
    const sanitizedKey = key.split("?")[0];
    const normalizedKey = sanitizedKey.startsWith(`${bucket}/`)
      ? sanitizedKey.slice(bucket.length + 1)
      : sanitizedKey.replace(/^\/+/, "");
    if (!normalizedKey) {
      return NextResponse.json({ error: "Invalid key parameter" }, { status: 400 });
    }
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: normalizedKey
    });
    const object = await client.send(command);
    const stream = toWebReadableStream(object.Body);
    if (!stream) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return new NextResponse(stream, {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": object.CacheControl ?? "public, max-age=86400",
        ...(object.ContentLength
          ? { "Content-Length": object.ContentLength.toString() }
          : {})
      }
    });
  } catch (error) {
    console.error("[api/media] error", error);
    return new NextResponse("Not Found", { status: 404 });
  }
}


