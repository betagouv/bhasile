import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/app/utils/api-error-response.util";
import { SPREADSHEET_MIME_TYPES } from "@/constants";
import { assertCockpitAdminAccess } from "@/lib/casl";
import { getSessionUser } from "@/lib/next-auth/session";
import { ImportFile } from "@/types/import.type";

import { readUploadedFile } from "./upload.server.util";

export const cockpitImportRoute =
  (run: (file: ImportFile) => Promise<unknown>) =>
  async (request: Request): Promise<NextResponse> => {
    try {
      assertCockpitAdminAccess(await getSessionUser());
      const file = await readUploadedFile(request, SPREADSHEET_MIME_TYPES);
      return NextResponse.json(await run(file));
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
