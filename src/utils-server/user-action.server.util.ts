import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { apiErrorResponse } from "@/app/utils/apiErrorResponse.util";
import { authOptions } from "@/lib/next-auth/auth";

type UserActionCallback<DataType> = (
  userActionBody: DataType
) => Promise<void> | void;

export function createUserActionRoute<SchemaType extends z.ZodType>(
  actionFunction: UserActionCallback<z.infer<SchemaType>>,
  schema: SchemaType
) {
  return async function POST(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      const body = await request.json();
      const parsedBody = schema.parse(body);

      await actionFunction(parsedBody);

      return NextResponse.json("Action enregistrée avec succès", {
        status: 200,
      });
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
}
