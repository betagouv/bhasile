import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiDomainError } from "./apiDomainError.util";

export const apiErrorResponse = (error: unknown): NextResponse => {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: z.prettifyError(error) }, { status: 400 });
  }
  if (error instanceof ApiDomainError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json(
    {
      error: "Erreur interne du serveur",
      details: error instanceof Error ? error.message : String(error),
    },
    { status: 500 }
  );
};
