import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { getNotifications } from "@/app/api/notifications/notification.service";
import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { authOptions } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const items = await getNotifications(session.user as SessionUser);
    return NextResponse.json(items);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
