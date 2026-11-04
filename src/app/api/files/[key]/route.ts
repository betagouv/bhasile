import { NextRequest, NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";

import {
  authorizeTarificationDocument,
  type PendingTarificationOpening,
  recordTarificationDocumentOpening,
} from "@/app/api/tarifications/tarification.service";
import { DomainError } from "@/app/utils/domain-error.util";
import { INLINE_VIEWABLE_MIME_TYPES } from "@/constants";
import { authOptions } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";

import type { FileWithParents } from "../file.db.type";
import {
  authorizeFileAccess,
  deleteFile,
  deleteFileByStorageKey,
  getDownloadLink,
  getFileWithParents,
  getInlineLink,
  getPrincipal,
} from "../file.service";

const getFileAccess = async (
  session: Session | null,
  file: FileWithParents
): Promise<FileAccess | null> => {
  if (!file.tarificationDocument) {
    return authorizeFileAccess(getPrincipal(session), file, "read")
      ? { pendingOpening: null }
      : null;
  }
  if (!session?.user) {
    return null;
  }
  try {
    return {
      pendingOpening: await authorizeTarificationDocument({
        user: session.user as SessionUser,
        document: file.tarificationDocument,
      }),
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return null;
    }
    throw error;
  }
};

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

  const file = await getFileWithParents(key);
  const access = file && (await getFileAccess(session, file));
  if (!file || !access) {
    return NextResponse.json(
      { error: "Aucun fichier trouvé" },
      { status: 404 }
    );
  }

  if (getLink) {
    try {
      const isInline =
        request.nextUrl.searchParams.get("inline") === "true" &&
        INLINE_VIEWABLE_MIME_TYPES.includes(file.mimeType);
      const url = isInline
        ? await getInlineLink(process.env.S3_BUCKET_NAME!, key, file.mimeType)
        : await getDownloadLink(process.env.S3_BUCKET_NAME!, key);
      // L'ouverture fait courir le contradictoire
      if (access.pendingOpening) {
        await recordTarificationDocumentOpening(access.pendingOpening);
      }
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
    return NextResponse.json(
      { error: "Aucun fichier trouvé" },
      { status: 404 }
    );
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

type FileAccess = { pendingOpening: PendingTarificationOpening | null };
