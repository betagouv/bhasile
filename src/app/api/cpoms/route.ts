import { NextRequest, NextResponse } from "next/server";

import { cpomApiAjoutSchema, cpomApiSchema } from "@/schemas/api/cpom.schema";

import { countAll, createOrUpdateCpom, findAll } from "./cpom.repository";

export async function GET() {
  const cpoms = await findAll();
  const totalCpoms = await countAll();

  return NextResponse.json({ cpoms, totalCpoms });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = cpomApiAjoutSchema.parse(body);
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
    const result = cpomApiSchema.parse(body);
    const cpomId = await createOrUpdateCpom(result);
    return NextResponse.json({ cpomId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}
