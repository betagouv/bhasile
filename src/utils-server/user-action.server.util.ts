import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { authOptions } from "@/lib/next-auth/auth";
import {
  userActionApiSchema,
  UserActionApiType,
} from "@/schemas/api/user-action.schema";

type UserActionCallback = (
  userActionBody: UserActionApiType
) => Promise<void> | void;

export function createUserActionRoute(actionFunction: UserActionCallback) {
  return async function POST(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      const body = await request.json();
      const result = userActionApiSchema.parse(body);

      await actionFunction(result);

      return NextResponse.json("Action enregistrée avec succès", {
        status: 200,
      });
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
}
