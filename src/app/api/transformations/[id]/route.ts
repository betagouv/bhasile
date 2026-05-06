import { NextRequest, NextResponse } from "next/server";

<<<<<<< HEAD
import { transformationApiWriteSchema } from "@/schemas/api/transformation.schema";
=======
import { transformationApiUpdateSchema } from "@/schemas/api/transformation.schema";
>>>>>>> origin/migration

import {
  getTransformation,
  updateTransformation,
} from "../transformation.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transformation = await getTransformation(Number(id));
    if (!transformation) {
      return NextResponse.json(
        { error: "Transformation non trouvée" },
        { status: 404 }
      );
    }
    return NextResponse.json(transformation);
  } catch (error) {
    console.error("Error in GET /api/transformations/[id]", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
<<<<<<< HEAD
    const result = transformationApiWriteSchema.parse(body);
=======
    const result = transformationApiUpdateSchema.parse(body);
>>>>>>> origin/migration
    await updateTransformation(result);
    return NextResponse.json("Transformation mise à jour avec succès", {
      status: 201,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}
