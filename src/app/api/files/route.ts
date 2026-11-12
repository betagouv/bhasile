import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { readUploadedFile } from "@/utils-server/upload.server.util";

import { createUploadedFile, getSha256, uploadFile } from "./file.service";

export async function POST(req: Request) {
  try {
    const file = await readUploadedFile(req);

    const uploadResult = await uploadFile(
      process.env.S3_BUCKET_NAME!,
      file.fileName,
      file.buffer,
      file.mimeType
    );
    const sha256 = getSha256(file.buffer);

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
  } catch (error) {
    return apiErrorResponse(error);
  }
}
