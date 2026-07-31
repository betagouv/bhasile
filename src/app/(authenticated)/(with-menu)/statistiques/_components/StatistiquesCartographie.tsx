import { ReactElement } from "react";

import { CartographieMenu } from "./cartographie/CartographieMenu";
import { FranceMap } from "./cartographie/FranceMap";

export const StatistiquesCartographie = (): ReactElement => {
  return (
    <div className="flex">
      <CartographieMenu />
      <div className="w-full h-full">
        <FranceMap />
      </div>
    </div>
  );
};
