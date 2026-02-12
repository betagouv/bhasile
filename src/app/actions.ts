"use server";

import { cookies } from "next/headers";

import { THREE_MONTHS_IN_SECONDS } from "@/constants";

export async function closeNotice(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("display-name-change", "false", {
    httpOnly: true,
    path: "/",
    maxAge: THREE_MONTHS_IN_SECONDS,
  });
}
