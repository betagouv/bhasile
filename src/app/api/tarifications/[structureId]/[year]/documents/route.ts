import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {
  depositTarificationDocument,
  getTarificationParticipant,
} from "@/app/api/tarifications/tarification.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { authOptions } from "@/lib/next-auth/auth";
import { tarificationParamsSchema } from "@/schemas/api/message.schema";
import { tarificationDocumentApiCreateSchema } from "@/schemas/api/tarification.schema";
import { SessionUser } from "@/types/global";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ structureId: string; year: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { structureId, year } = tarificationParamsSchema.parse(await params);
    const input = tarificationDocumentApiCreateSchema.parse(
      await request.json()
    );

    const author = await getTarificationParticipant(
      session.user as SessionUser,
      structureId
    );
    const document = await depositTarificationDocument({
      structureId,
      year,
      author,
      ...input,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
