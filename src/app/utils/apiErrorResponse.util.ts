import { NextResponse } from "next/server";
import { z } from "zod";

export class ApiDomainError extends Error {
  constructor(
    message: string,
    readonly status: number = 400
  ) {
    super(message);
    this.name = "ApiDomainError";
  }
}

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
