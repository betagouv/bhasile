import { NextRequest, NextResponse } from "next/server";

import { createCpomEvent } from "@/app/api/user-actions/user-action.service";
import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { cpomApiAjoutSchema } from "@/schemas/api/cpom.schema";
import { CpomColumn } from "@/types/ListColumn";

import { getCpoms, saveCpom } from "./cpom.service";

export async function GET(request: NextRequest) {
  const pageParam = Number(request.nextUrl.searchParams.get("page"));
  const page = Number.isInteger(pageParam) ? pageParam : null;
  const departements = request.nextUrl.searchParams.get("departements");
  const column = request.nextUrl.searchParams.get(
    "column"
  ) as CpomColumn | null;
  const direction = request.nextUrl.searchParams.get("direction") as
    "asc" | "desc" | null;

  try {
    const { cpoms, totalCpoms } = await getCpoms({
      page,
      departements,
      column,
      direction,
    });
    return NextResponse.json({
      cpoms,
      totalCpoms,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = cpomApiAjoutSchema.parse(body);
    const cpomId = await saveCpom(result);
    createCpomEvent(request.method, cpomId);
    return NextResponse.json({ cpomId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
