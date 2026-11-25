import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { markNotificationsSeen } from "@/app/api/notifications/notification.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { authOptions } from "@/lib/next-auth/auth";
import { notificationSeenApiUpdateSchema } from "@/schemas/api/notification.schema";
import { SessionUser } from "@/types/global";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const { seenUntil } = notificationSeenApiUpdateSchema.parse(
      await request.json()
    );
    await markNotificationsSeen(session.user as SessionUser, seenUntil);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
