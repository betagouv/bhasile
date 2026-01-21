import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, mimeType, originalName, fileSize } = body || {};

    if (!key || !mimeType || !originalName || !fileSize) {
      return NextResponse.json(
        { error: "Missing file upload data" },
        { status: 400 }
      );
    }

    const existing = await prisma.fileUpload.findUnique({ where: { key } });
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const created = await prisma.fileUpload.create({
      data: {
        key,
        mimeType,
        originalName,
        fileSize,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/test/files", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
