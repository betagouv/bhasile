import { createStructureSpreadsheetExportEvent } from "@/app/api/user-actions/user-action.service";
import { userActionStructureApiSchema } from "@/schemas/api/user-action.schema";
import { createUserActionRoute } from "@/utils-server/user-action.server.util";

export const POST = createUserActionRoute(
  ({ structureId }) =>
    createStructureSpreadsheetExportEvent("GET", Number(structureId)),
  userActionStructureApiSchema
);
