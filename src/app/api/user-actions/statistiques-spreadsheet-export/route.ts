import { createStatistiquesSpreadsheetExportEvent } from "@/app/api/user-actions/user-action.service";
import { userActionDetailsApiSchema } from "@/schemas/api/user-action.schema";
import { createUserActionRoute } from "@/utils-server/user-action.server.util";

export const POST = createUserActionRoute(
  ({ details }) => createStatistiquesSpreadsheetExportEvent("GET", details),
  userActionDetailsApiSchema
);
