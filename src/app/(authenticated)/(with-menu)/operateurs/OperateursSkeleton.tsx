import { ReactElement } from "react";

import Loader from "@/app/components/ui/Loader";

export const OperateursSkeleton = (): ReactElement => (
  <div className="flex items-center p-16 gap-4">
    <Loader />
    <span>Chargement des opérateurs...</span>
  </div>
);
