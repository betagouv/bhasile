import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { SPREADSHEET_MIME_TYPES } from "@/constants";
import { assertCockpitAdminAccess } from "@/lib/casl";
import { getSessionUser } from "@/lib/next-auth/session";
import { importMonthSchema } from "@/schemas/api/import.schema";
import { ImportFile } from "@/types/import.type";

import { readUploadedFile } from "./upload.server.util";

export const cockpitImportRoute =
  (run: (file: ImportFile) => Promise<unknown>) =>
  async (request: Request): Promise<NextResponse> => {
    try {
      assertCockpitAdminAccess(await getSessionUser());
      const { buffer, fileName, fields } = await readUploadedFile(
        request,
        SPREADSHEET_MIME_TYPES
      );
      const month = importMonthSchema.parse(fields.month ?? null);
      return NextResponse.json(await run({ buffer, fileName, month }));
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
