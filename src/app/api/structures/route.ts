import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { authOptions } from "@/lib/next-auth/auth";
import { structureOperateurUpdateApiSchema } from "@/schemas/api/structure.schema";
import { SessionUser } from "@/types/global";
import { StructureColumn } from "@/types/ListColumn";

import { createStructureEvent } from "../user-action/user-action.service";
import {
  getFullStructures,
  updateStructureOperateur,
} from "./structure.service";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
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
  const finalised = request.nextUrl.searchParams.get("finalised") === "true";
  const isClosed = request.nextUrl.searchParams.get("isClosed") === "true";

  const { structures, totalStructures } = await getFullStructures(
    {
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
      finalised,
      isClosed,
    },
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

