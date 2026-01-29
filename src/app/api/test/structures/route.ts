import { NextRequest, NextResponse } from "next/server";

import {
  createMinimalStructure,
  deleteStructure,
} from "./structure.repository";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const dnaCode = body?.dnaCode;
    const type = body?.type;
    const operateurId = body?.operateurId;
    const departementAdministratif = body?.departementAdministratif;
    const nom = body?.nom;
    const adresseAdministrative = body?.adresseAdministrative;
    const codePostalAdministratif = body?.codePostalAdministratif;
    const communeAdministrative = body?.communeAdministrative;

    if (!dnaCode) {
      return NextResponse.json(
        { error: "dnaCode is required" },
        { status: 400 }
      );
    }

    await createMinimalStructure({
      dnaCode,
      type,
      operateurId,
      departementAdministratif,
      nom,
      adresseAdministrative,
      codePostalAdministratif,
      communeAdministrative,
    });

    return NextResponse.json({ dnaCode }, { status: 201 });
  } catch (error) {
    console.error("Failed to create minimal structure:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Erreur interne", details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  try {
    const dnaCode = request.nextUrl.searchParams.get("dnaCode");
    if (!dnaCode) {
      return NextResponse.json(
        { error: "dnaCode is required" },
        { status: 400 }
      );
    }

    await deleteStructure(dnaCode);

    return NextResponse.json({ dnaCode }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete structure:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
