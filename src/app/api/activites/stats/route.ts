import { NextRequest, NextResponse } from "next/server";

import { getAverageDepartementPlaces } from "../activite.service";

export async function GET(request: NextRequest) {
  const departement = request.nextUrl.searchParams.get("departement");
  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");
  const averageDepartementPlaces = await getAverageDepartementPlaces(
    departement,
    startDate,
    endDate
  );

  return NextResponse.json(averageDepartementPlaces);
}
