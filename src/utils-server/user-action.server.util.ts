import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { authOptions } from "@/lib/next-auth/auth";
import { userActionApiSchema } from "@/schemas/api/user-action.schema";

type ActionCallback = (structureId: number) => Promise<void> | void;

export function createUserActionRoute(actionFunction: ActionCallback) {
  return async function POST(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      const body = await request.json();
      const result = userActionApiSchema.parse(body);

      await actionFunction(result.structureId);

      return NextResponse.json("Action enregistrée avec succès", {
        status: 200,
      });
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
}
