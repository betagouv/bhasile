import { NextRequest, NextResponse } from "next/server";

import {
  structureAgentUpdateApiSchema,
  structureOperateurUpdateApiSchema,
} from "@/schemas/api/structure.schema";
import { StructureColumn } from "@/types/ListColumn";

import {
  countBySearch,
  findBySearch,
  updateOneAgent,
  updateOneOperateur,
} from "./structure.repository";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search");
  const page = request.nextUrl.searchParams.get("page") as number | null;
  const type = request.nextUrl.searchParams.get("type");
  const bati = request.nextUrl.searchParams.get("bati");
  const placesAutorisees = request.nextUrl.searchParams.get("places") as
    | string
    | null;
  const departements = request.nextUrl.searchParams.get("departements");
  const operateurs = request.nextUrl.searchParams.get("operateurs");
  const column = request.nextUrl.searchParams.get(
    "column"
  ) as StructureColumn | null;
  const direction = request.nextUrl.searchParams.get("direction") as
    | "asc"
    | "desc"
    | null;
  const map = request.nextUrl.searchParams.get("map") === "true";
  const selection = request.nextUrl.searchParams.get("selection") === "true";
  const structures = await findBySearch({
    search,
    page,
    type,
    bati,
    placesAutorisees,
    departements,
    map,
    column,
    direction,
    operateurs,
    selection,
  });
  const totalStructures = await countBySearch({
    search,
    page,
    type,
    bati,
    placesAutorisees,
    departements,
    operateurs,
  });

  return NextResponse.json({ structures, totalStructures });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = structureOperateurUpdateApiSchema.parse(body);
    await updateOneOperateur(result);
    return NextResponse.json("Structure créée avec succès", { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = structureAgentUpdateApiSchema.parse(body);
    await updateOneAgent(result);
    return NextResponse.json("Structure mise à jour avec succès", {
      status: 201,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}
