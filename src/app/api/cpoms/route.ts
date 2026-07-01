import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { cpomApiAjoutSchema } from "@/schemas/api/cpom.schema";
import { CpomColumn } from "@/types/ListColumn";

import { createCpomEvent } from "../user-action/user-action.service";
import { getCpoms, saveCpom } from "./cpom.service";

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page") as number | null;
  const departements = request.nextUrl.searchParams.get("departements");
  const column = request.nextUrl.searchParams.get(
    "column"
  ) as CpomColumn | null;
  const direction = request.nextUrl.searchParams.get("direction") as
    | "asc"
    | "desc"
    | null;

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

