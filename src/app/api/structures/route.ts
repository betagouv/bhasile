import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {
  parseSortDirection,
  parseStructureColumn,
} from "@/app/utils/search-params.util";
import { authOptions } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";

import { getFullStructures } from "./structure.service";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const search = request.nextUrl.searchParams.get("search");
  const pageParam = Number(request.nextUrl.searchParams.get("page"));
  const page = Number.isInteger(pageParam) ? pageParam : null;
  const types = request.nextUrl.searchParams.get("types");
  const departements = request.nextUrl.searchParams.get("departements");
  const operateurs = request.nextUrl.searchParams.get("operateurs");
  const operateurName = request.nextUrl.searchParams.get("operateurName");
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
    types,
    departements,
    column,
    direction,
    operateurs,
    operateurName,
    selection,
    isFinalised,
    isClosed,
    user: session?.user as SessionUser | undefined,
  };

  const { structures, totalStructures } = await getFullStructures(searchProps);

  return NextResponse.json({ structures, totalStructures });
}
