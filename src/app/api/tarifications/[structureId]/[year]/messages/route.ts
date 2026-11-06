import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {
  getTarificationMessages,
  getTarificationParticipant,
  getTarificationReader,
  postTarificationMessage,
} from "@/app/api/tarifications/tarification.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { authOptions } from "@/lib/next-auth/auth";
import {
  conversationQuerySchema,
  messageApiCreateSchema,
  tarificationParamsSchema,
} from "@/schemas/api/message.schema";
import { SessionUser } from "@/types/global";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ structureId: string; year: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { structureId, year } = tarificationParamsSchema.parse(await params);
    const { visibility } = conversationQuerySchema.parse({
      visibility: request.nextUrl.searchParams.get("visibility"),
    });

    const reader = await getTarificationReader(
      session.user as SessionUser,
      structureId
    );
    const messages = await getTarificationMessages({
      structureId,
      year,
      visibility,
      reader,
    });

    return NextResponse.json(messages);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

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
    const input = messageApiCreateSchema.parse(await request.json());

    const author = await getTarificationParticipant(
      session.user as SessionUser,
      structureId
    );
    const message = await postTarificationMessage({
      structureId,
      year,
      author,
      ...input,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
