import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { canUpdateStructure } from "@/lib/casl/abilities";
import { authOptions } from "@/lib/next-auth/auth";
import {
  structureAgentUpdateApiSchema,
  structureOperateurUpdateApiSchema,
} from "@/schemas/api/structure.schema";
import { SessionUser } from "@/types/global";
import { StructureColumn } from "@/types/ListColumn";

import { createStructureEvent } from "../user-action/user-action.service";
import {
  getFullStructures,
  getStructure,
  updateStructureAgent,
  updateStructureOperateur,
} from "./structure.service";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search");
  const page = request.nextUrl.searchParams.get("page") as number | null;
  const type = request.nextUrl.searchParams.get("type");
  const bati = request.nextUrl.searchParams.get("bati");
  const placesAutorisees = request.nextUrl.searchParams.get("places") as
    | string
    | null;
  const departements = request.nextUrl.searchParams.get("departements");
  const operateurs = request.nextUrl.searchParams.get("operateurs");
  const column = request.nextUrl.searchParams.get(
    "column"
  ) as StructureColumn | null;
  const direction = request.nextUrl.searchParams.get("direction") as
    | "asc"
    | "desc"
    | null;
  const map = request.nextUrl.searchParams.get("map") === "true";
  const selection = request.nextUrl.searchParams.get("selection") === "true";

  const { structures, totalStructures } = await getFullStructures({
    search,
    page,
    type,
    bati,
    placesAutorisees,
    departements,
    map,
    column,
    direction,
    operateurs,
    selection,
  });

  return NextResponse.json({ structures, totalStructures });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = structureOperateurUpdateApiSchema.parse(body);
    const createdStructure = await updateStructureOperateur(result);
    createStructureEvent(request.method, createdStructure.id);
    return NextResponse.json("Structure créée avec succès", { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}

// TODO : déplacer dans structures/[id] pour respecter les principes REST
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const result = structureAgentUpdateApiSchema.parse(body);

    const existingStructure = await getStructure(result.id);

    if (!canUpdateStructure(session.user as SessionUser, existingStructure)) {
      return NextResponse.json(
        { error: "Droits insuffisants" },
        { status: 403 }
      );
    }

    const updatedStructure = await updateStructureAgent(result);
    createStructureEvent(request.method, updatedStructure.id);
    return NextResponse.json("Structure mise à jour avec succès", {
      status: 201,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 400 });
  }
}
