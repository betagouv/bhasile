import { NextRequest, NextResponse } from "next/server";

import { createPrismaClient } from "../../../../../prisma/client";

const prisma = createPrismaClient();

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const dnaCode = body?.dnaCode;
    const type = body?.type;
    const operateurName = body?.operateurName;
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

    let resolvedOperateurId: number | undefined = operateurId;
    if (operateurName) {
      const operateur = await prisma.operateur.upsert({
        where: { name: operateurName },
        update: {},
        create: { name: operateurName },
      });
      resolvedOperateurId = operateur.id;
    }

    const data: Record<string, unknown> = {};
    if (type) {
      data.type = type;
    }
    if (resolvedOperateurId) {
      data.operateurId = resolvedOperateurId;
    }
    if (departementAdministratif) {
      data.departementAdministratif = departementAdministratif;
    }
    if (nom) {
      data.nom = nom;
    }
    if (adresseAdministrative) {
      data.adresseAdministrative = adresseAdministrative;
    }
    if (codePostalAdministratif) {
      data.codePostalAdministratif = codePostalAdministratif;
    }
    if (communeAdministrative) {
      data.communeAdministrative = communeAdministrative;
    }

    if (departementAdministratif) {
      await prisma.departement.upsert({
        where: { numero: departementAdministratif },
        update: {},
        create: {
          numero: departementAdministratif,
          name: "Département de test",
          region: "Région de test",
        },
      });
    }

    await prisma.structure.upsert({
      where: { dnaCode },
      update: data,
      create: { dnaCode, ...data },
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

    await prisma.structure.deleteMany({ where: { dnaCode } });
    return NextResponse.json({ dnaCode }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete structure:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
