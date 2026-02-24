"use server";

import { NextResponse } from "next/server";

import { createOne } from "./file.repository";
import { uploadFile, validateUpload } from "./file.service";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  const validationResult = validateUpload(file.type, file.size);

  if (validationResult) {
    return NextResponse.json({ error: validationResult }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json(
      { error: "Aucun fichier fourni" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const uploadResult = await uploadFile(
    process.env.S3_BUCKET_NAME!,
    file.name,
    Buffer.from(arrayBuffer),
    file.type
  );

  const createdFileUpload = await createOne({
    key: uploadResult.key,
    mimeType: uploadResult.mimeType,
    originalName: uploadResult.originalName,
    fileSize: file.size,
  });

  return NextResponse.json({
    ...uploadResult,
    id: createdFileUpload?.id,
    fileSize: file.size,
  });
}
