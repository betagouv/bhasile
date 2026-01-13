"use server";

import { cookies } from "next/headers";

import { ONE_WEEK_IN_SECONDS } from "@/constants";

export async function verifyPassword(
  password: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const passwords = process.env.OPERATEUR_PASSWORDS?.split(",").map(
      (password) => password.trim()
    );
    const isValid = passwords?.includes(password);

    if (isValid) {
      const cookieStore = await cookies();
      cookieStore.set("mot-de-passe", password, {
        httpOnly: true,
        path: "/",
        maxAge: ONE_WEEK_IN_SECONDS,
      });

      return { success: true };
    }

    return { success: false, message: "Mot de passe incorrect" };
  } catch (error) {
    console.error("Error setting password cookie:", error);
    return {
      success: false,
      message: "Une erreur est survenue. Veuillez réessayer.",
    };
  }
}
