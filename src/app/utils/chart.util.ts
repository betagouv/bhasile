import * as Chartist from "chartist";

import { formatCompactNumber } from "./number.util";

export const withCompactAxisY = <
  Options extends Chartist.BarChartOptions | Chartist.LineChartOptions,
>(
  options: Options
): Options => ({
  ...options,
  axisY: {
    ...options.axisY,
    labelInterpolationFnc:
      options.axisY?.labelInterpolationFnc ??
      ((value: number | string) => formatCompactNumber(value)),
  },
});
