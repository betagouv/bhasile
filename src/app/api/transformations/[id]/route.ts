import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { canUpdateTransformation } from "@/lib/casl/abilities";
import { authOptions } from "@/lib/next-auth/auth";
import { transformationApiUpdateSchema } from "@/schemas/api/transformation.schema";
import { SessionUser } from "@/types/global";

import {
  deleteTransformation,
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const transformation = await getTransformation(Number(id));
    if (!transformation) {
      return NextResponse.json(
        { error: "Transformation non trouvée" },
        { status: 404 }
      );
    }
    if (!canUpdateTransformation(session.user as SessionUser, transformation)) {
      return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    }

    await deleteTransformation(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error in DELETE /api/transformations/[id]", error);
    if (
      error instanceof Error &&
      error.message.includes("transformation finalisée")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const result = transformationApiUpdateSchema.parse(body);

    const transformation = await getTransformation(result.id);
    if (!transformation) {
      return NextResponse.json(
        { error: "Transformation non trouvée" },
        { status: 404 }
      );
    }
    if (!canUpdateTransformation(session.user as SessionUser, transformation)) {
      return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    }

    const transformationId = await updateTransformation(result);
    return NextResponse.json({ transformationId }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 400 }
    );
  }
}
