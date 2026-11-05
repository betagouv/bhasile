import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {
  getTarificationParticipant,
  markTarificationMessagesAsRead,
} from "@/app/api/tarifications/tarification.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { authOptions } from "@/lib/next-auth/auth";
import {
  messageReceiptApiCreateSchema,
  tarificationParamsSchema,
} from "@/schemas/api/message.schema";
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
    const input = messageReceiptApiCreateSchema.parse(await request.json());

    const reader = await getTarificationParticipant(
      session.user as SessionUser,
      structureId
    );
    const receipts = await markTarificationMessagesAsRead({
      structureId,
      year,
      reader,
      ...input,
    });

    return NextResponse.json(receipts);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
