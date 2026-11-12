import { applyOfiiImport } from "@/app/api/ofii-imports/ofii-import.service";
import { cockpitImportRoute } from "@/utils-server/import.server.util";

export const POST = cockpitImportRoute(applyOfiiImport);
