import { NextResponse } from "next/server";

import {
  createUploadedFile,
  getSha256,
  uploadFile,
  validateUpload,
} from "./file.service";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Aucun fichier fourni" },
      { status: 400 }
    );
  }

  const validationResult = validateUpload(file.type, file.size);

  if (validationResult) {
    return NextResponse.json({ error: validationResult }, { status: 400 });
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const uploadResult = await uploadFile(
    process.env.S3_BUCKET_NAME!,
    file.name,
    fileBuffer,
    file.type
  );
  const sha256 = getSha256(fileBuffer);

  const createdFileUpload = await createUploadedFile({
    key: uploadResult.key,
    mimeType: uploadResult.mimeType,
    originalName: uploadResult.originalName,
    fileSize: file.size,
    sha256,
  });

  return NextResponse.json({
    ...uploadResult,
    id: createdFileUpload?.id,
    fileSize: file.size,
    sha256,
  });
}
