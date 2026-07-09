import { ReactElement } from "react";

export const getTypePlaceEditHeadings = (years: number[]): ReactElement[] => {
  return [
    <th key="label" scope="col">
      <span className="sr-only">Type de place</span>
    </th>,
    ...years.map((year) => (
      <th key={year} scope="col" data-year={year}>
        {year}
      </th>
    )),
  ];
};
