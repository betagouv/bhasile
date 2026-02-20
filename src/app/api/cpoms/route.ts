import { NextRequest, NextResponse } from "next/server";

import { cpomSchema } from "@/schemas/forms/base/cpom.schema";

import { countAll, createOrUpdateCpom, findAll } from "./cpom.repository";
import { computeCpom } from "./cpom.util";

export async function GET() {
  try {
    const [dbCpoms, totalCpoms] = await Promise.all([findAll(), countAll()]);
    const cpoms = dbCpoms.map((cpom) => computeCpom(cpom));
    return NextResponse.json({ cpoms, totalCpoms });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch cpoms" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = cpomSchema.parse(body);
    const cpomId = await createOrUpdateCpom(result);
    return NextResponse.json({ cpomId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = cpomSchema.parse(body);
    const cpomId = await createOrUpdateCpom(result);
    return NextResponse.json({ cpomId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}
