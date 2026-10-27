import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import {
  parseSortDirection,
  parseStructureColumn,
} from "@/app/utils/search-params.util";
import { canAccessApp } from "@/lib/casl";
import { authOptions } from "@/lib/next-auth/auth";
import { structureOperateurUpdateApiSchema } from "@/schemas/api/structure.schema";
import { SessionUser } from "@/types/global";

import { createStructureEvent } from "../user-actions/user-action.service";
import {
  getFullStructures,
  getFullStructuresForOperateur,
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
  const column = parseStructureColumn(
    request.nextUrl.searchParams.get("column")
  );
  const direction = parseSortDirection(
    request.nextUrl.searchParams.get("direction")
  );
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
    user: session?.user as SessionUser | undefined,
  };

  const { structures, totalStructures } =
    searchProps.user && canAccessApp(searchProps.user)
      ? await getFullStructures(searchProps)
      : await getFullStructuresForOperateur(searchProps);

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
