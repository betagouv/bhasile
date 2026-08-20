import { createFinancesSpreadsheetExportEvent } from "@/app/api/user-actions/user-action.service";
import { createUserActionRoute } from "@/utils-server/user-action.server.util";

export const POST = createUserActionRoute((structureId) =>
  createFinancesSpreadsheetExportEvent("GET", structureId)
);
