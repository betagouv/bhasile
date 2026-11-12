import { applyOfiiImport } from "@/app/api/ofii-imports/ofii-import.service";
import { cockpitImportRoute } from "@/utils-server/cockpit-import-route.server.util";

export const POST = cockpitImportRoute(applyOfiiImport);
