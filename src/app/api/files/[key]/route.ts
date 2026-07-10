import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/next-auth/auth";

import type { FileWithParents } from "../file.db.type";
import {
  authorizeFileAccess,
  deleteFile,
  deleteFileByStorageKey,
  getDownloadLink,
  getFileWithParents,
  getPrincipal,
} from "../file.service";

const toFileResponse = (file: FileWithParents) => ({
  id: file.id,
  key: file.key,
  mimeType: file.mimeType,
  originalName: file.originalName,
  fileSize: file.fileSize,
});

export async function GET(request: NextRequest) {
  const encodedKey = request.nextUrl.pathname.split("/").pop();
  if (!encodedKey) {
    return NextResponse.json(
      { error: "La clé n'est pas fournie" },
      { status: 400 }
    );
  }
  const key = decodeURIComponent(encodedKey);
  const getLink = request.nextUrl.searchParams.get("getLink");

  const session = await getServerSession(authOptions);
  const principal = getPrincipal(session);

  const file = await getFileWithParents(key);
  if (!file || !authorizeFileAccess(principal, file, "read")) {
    return NextResponse.json({ error: "Aucun fichier trouvé" }, { status: 404 });
  }

  if (getLink) {
    try {
      const url = await getDownloadLink(process.env.S3_BUCKET_NAME!, key);
      return NextResponse.json({ url });
    } catch (error) {
      console.error(error);
      throw new Error(
        "Impossible de récupérer le lien de téléchargement du fichier"
      );
    }
  }

  return NextResponse.json(toFileResponse(file));
}

export async function DELETE(request: NextRequest) {
  const encodedKey = request.nextUrl.pathname.split("/").pop();
  if (!encodedKey) {
    return NextResponse.json(
      { error: "La clé n'est pas fournie" },
      { status: 400 }
    );
  }
  const key = decodeURIComponent(encodedKey);

  const session = await getServerSession(authOptions);
  const principal = getPrincipal(session);

  const file = await getFileWithParents(key);
  if (!file || !authorizeFileAccess(principal, file, "delete")) {
    return NextResponse.json({ error: "Aucun fichier trouvé" }, { status: 404 });
  }

  try {
    await deleteFile(process.env.S3_BUCKET_NAME!, key);

    const deletedFile = await deleteFileByStorageKey(key);

    return NextResponse.json(deletedFile);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du fichier" },
      { status: 500 }
    );
  }
}
