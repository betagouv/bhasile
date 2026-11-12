import { NextRequest, NextResponse } from "next/server";

import { editFaqItem, removeFaqItem } from "@/app/api/faq/faq.service";
import { parseFaqItemId } from "@/app/api/faq/faq.util";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { assertCockpitAdminAccess } from "@/lib/casl";
import { getSessionUser } from "@/lib/next-auth/session";
import { faqApiWriteSchema } from "@/schemas/api/faq.schema";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertCockpitAdminAccess(await getSessionUser());
    const id = await parseFaqItemId(params);
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
    assertCockpitAdminAccess(await getSessionUser());
    const id = await parseFaqItemId(params);

    await removeFaqItem(id);

    return NextResponse.json("Question supprimée avec succès", {
      status: 200,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
