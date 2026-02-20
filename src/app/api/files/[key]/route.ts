import { NextRequest, NextResponse } from "next/server";

import { deleteOneByKey, findOneByKey } from "../file.repository";
import { deleteFile, getDownloadLink } from "../file.service";

export async function GET(request: NextRequest) {
  const encodedKey = request.nextUrl.pathname.split("/").pop();
  const getLink = request.nextUrl.searchParams.get("getLink");
  const decodedKey = decodeURIComponent(encodedKey || "");

  if (getLink) {
    try {
      const result = await getDownloadLink(
        process.env.S3_BUCKET_NAME!,
        decodedKey
      );
      return NextResponse.json({ url: result });
    } catch (error) {
      console.error(error);
      throw new Error(
        "Impossible de récupérer le lien de téléchargement du fichier"
      );
    }
  }

  if (!encodedKey) {
    return NextResponse.json(
      { error: "La clé n'est pas fournie" },
      { status: 400 }
    );
  }

  const key = decodeURIComponent(encodedKey);

  const file = await findOneByKey(key);
  if (!file) {
    return NextResponse.json(
      { error: "Aucun fichier trouvé" },
      { status: 404 }
    );
  }
  return NextResponse.json(file);
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

  const file = await findOneByKey(key);
  if (!file) {
    return NextResponse.json(
      { error: "Aucun fichier trouvé" },
      { status: 404 }
    );
  }

  try {
    await deleteFile(process.env.S3_BUCKET_NAME!, key);

    const deletedFile = await deleteOneByKey(key);

    return NextResponse.json(deletedFile);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du fichier" },
      { status: 500 }
    );
  }
}
