import { ReactElement } from "react";

import { GenericTypeChart } from "./GenericTypeChart";

export const TypesBatis = (): ReactElement => {
  const colors = [
    "var(--blue-cumulus-main-526)",
    "var(--yellow-moutarde-850-200)",
    "var(--purple-glycine-main-494)",
  ];

  return (
    <GenericTypeChart
      title="Types de bâtis"
      colors={colors}
      typeAccessor="structureBatis"
    />
  );
};
