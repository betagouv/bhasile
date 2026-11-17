import { NextRequest, NextResponse } from "next/server";
import z from "zod";

import { EntityId } from "@/types/Entity.type";
import { StructureType } from "@/types/structure.type";

import { getDnaCodes } from "./dna-codes.service";

export async function GET(request: NextRequest) {
  const entityId: EntityId = {
    structureId:
      Number(request.nextUrl.searchParams.get("structureId")) || undefined,
    structureVersionId:
      Number(request.nextUrl.searchParams.get("structureVersionId")) ||
      undefined,
  };
  const transformationId =
    Number(request.nextUrl.searchParams.get("transformationId")) || undefined;
  const operateurId =
    Number(request.nextUrl.searchParams.get("operateurId")) || undefined;
  const departementAdministratif =
    request.nextUrl.searchParams.get("departementAdministratif") || undefined;
  const type = z
    .enum(StructureType)
    .safeParse(request.nextUrl.searchParams.get("type")).data;

  try {
    const dnaCodes = await getDnaCodes({
      entityId,
      transformationId,
      operateurId,
      departementAdministratif,
      type,
    });
    return NextResponse.json(dnaCodes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Échec de la récupération des codes DNA" },

      { status: 500 }
    );
  }
}
