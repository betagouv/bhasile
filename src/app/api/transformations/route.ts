import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/next-auth/auth";
import { transformationApiCreateSchema } from "@/schemas/api/transformation.schema";
import { SessionUser } from "@/types/global";

import {
  createTransformation,
  getOngoingTransformationsForUser,
} from "./transformation.service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user) {
      const transformations = await getOngoingTransformationsForUser(
        session.user as SessionUser
      );
      return NextResponse.json(transformations);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Erreur lors du GET /api/transformations", error);
    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = transformationApiCreateSchema.parse(body);
    const transformationId = await createTransformation(result);
    return NextResponse.json({ transformationId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}
