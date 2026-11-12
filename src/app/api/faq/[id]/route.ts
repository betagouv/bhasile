import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { editFaqItem, removeFaqItem } from "@/app/api/faq/faq.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { parseId } from "@/app/utils/string.util";
import { canAccessCockpitAdmin } from "@/lib/casl";
import { authOptions } from "@/lib/next-auth/auth";
import { faqApiWriteSchema } from "@/schemas/api/faq.schema";
import { SessionUser } from "@/types/global";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!canAccessCockpitAdmin(session.user as SessionUser)) {
      return NextResponse.json(
        { error: "Droits insuffisants" },
        { status: 403 }
      );
    }

    const id = parseId((await params).id);
    if (id === null) {
      return NextResponse.json(
        { error: "Question introuvable" },
        { status: 404 }
      );
    }

    const input = faqApiWriteSchema.parse(await request.json());
    await editFaqItem(id, input);

    return NextResponse.json("Question mise à jour avec succès", {
      status: 200,
    });
  } catch (error) {
    return apiErrorResponse(error);
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
    if (!canAccessCockpitAdmin(session.user as SessionUser)) {
      return NextResponse.json(
        { error: "Droits insuffisants" },
        { status: 403 }
      );
    }

    const id = parseId((await params).id);
    if (id === null) {
      return NextResponse.json(
        { error: "Question introuvable" },
        { status: 404 }
      );
    }

    await removeFaqItem(id);

    return NextResponse.json("Question supprimée avec succès", {
      status: 200,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
