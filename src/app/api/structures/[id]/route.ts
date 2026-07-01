import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { canUpdateDepartement } from "@/lib/casl/abilities";
import { authOptions } from "@/lib/next-auth/auth";
import { structureAgentUpdateApiSchema } from "@/schemas/api/structure.schema";
import { SessionUser } from "@/types/global";

import { createStructureEvent } from "../../user-action/user-action.service";
import {
  getFullStructure,
  getStructureDepartement,
  getStructureForOperateur,
  updateStructureAgent,
} from "../structure.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const doBypass =
      process.env.NODE_ENV !== "production" &&
      (process.env.DEV_AUTH_BYPASS ||
        request.headers.get("x-dev-auth-bypass") === "1");

    const isAuthenticated = !!session?.user || doBypass;

    const id = request.nextUrl.pathname.split("/").pop();
    const structure = isAuthenticated
      ? await getFullStructure(
          Number(id),
          session?.user as SessionUser | undefined
        )
      : await getStructureForOperateur(Number(id));

    if (!structure) {
      return NextResponse.json(
        { error: "Structure not found" },
        { status: 404 }
      );
    }

    createStructureEvent(request.method, structure.id);

    return NextResponse.json(structure);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = structureAgentUpdateApiSchema.parse({
      ...body,
      id: Number(id),
    });

    const departementAdministratif = await getStructureDepartement(result.id);
    if (
      !canUpdateDepartement(
        session.user as SessionUser,
        departementAdministratif
      )
    ) {
      return NextResponse.json(
        { error: "Droits insuffisants" },
        { status: 403 }
      );
    }

    const updatedStructure = await updateStructureAgent(result);
    createStructureEvent(request.method, updatedStructure.id);
    return NextResponse.json("Structure mise à jour avec succès", {
      status: 200,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
