import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { authOptions } from "@/lib/next-auth/auth";
import { structureOperateurUpdateApiSchema } from "@/schemas/api/structure.schema";
import { SessionUser } from "@/types/global";
import { StructureColumn } from "@/types/ListColumn";

import { createStructureEvent } from "../user-actions/user-action.service";
import {
  getFullStructures,
  getStructureMapPoints,
  updateStructureOperateur,
} from "./structure.service";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const search = request.nextUrl.searchParams.get("search");
  const pageParam = Number(request.nextUrl.searchParams.get("page"));
  const page = Number.isInteger(pageParam) ? pageParam : null;
  const type = request.nextUrl.searchParams.get("type");
  const bati = request.nextUrl.searchParams.get("bati");
  const placesAutorisees = request.nextUrl.searchParams.get("places");
  const departements = request.nextUrl.searchParams.get("departements");
  const operateurs = request.nextUrl.searchParams.get("operateurs");
  const column = request.nextUrl.searchParams.get(
    "column"
  ) as StructureColumn | null;
  const direction = request.nextUrl.searchParams.get("direction") as
    "asc" | "desc" | null;
  const map = request.nextUrl.searchParams.get("map") === "true";
  const selection = request.nextUrl.searchParams.get("selection") === "true";
  const isFinalised = request.nextUrl.searchParams.get("finalised") === "true";
  const isClosed = request.nextUrl.searchParams.get("closed") === "true";

  const searchProps = {
    search,
    page,
    type,
    bati,
    placesAutorisees,
    departements,
    column,
    direction,
    operateurs,
    selection,
    isFinalised,
    isClosed,
  };

  if (map) {
    const points = await getStructureMapPoints(searchProps);

    return NextResponse.json({
      structures: points,
      totalStructures: points.length,
    });
  }

  const { structures, totalStructures } = await getFullStructures(
    searchProps,
    session?.user as SessionUser | undefined
  );

  return NextResponse.json({ structures, totalStructures });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = structureOperateurUpdateApiSchema.parse(body);
    const createdStructure = await updateStructureOperateur(result);
    createStructureEvent(request.method, createdStructure.id);
    return NextResponse.json("Structure créée avec succès", { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
