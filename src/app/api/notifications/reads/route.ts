import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { markNotificationRead } from "@/app/api/notifications/notification.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { authOptions } from "@/lib/next-auth/auth";
import { notificationReadApiCreateSchema } from "@/schemas/api/notification.schema";
import { SessionUser } from "@/types/global";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const { eventId } = notificationReadApiCreateSchema.parse(
      await request.json()
    );
    await markNotificationRead(session.user as SessionUser, eventId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
