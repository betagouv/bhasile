"use client";

import { ReactElement } from "react";

import { DateBar, DatePair } from "./DateBar";

export const DateBars = ({ datePairs }: Props): ReactElement => {
  return (
    <div>
      {datePairs.map((datePair, index) => (
        <div key={index} className="flex pb-2">
          <div className="w-48 flex justify-end">
            <strong className="pr-2">{datePair.label}</strong>
          </div>
          <DateBar datePair={datePair} />
        </div>
      ))}
    </div>
  );
};

type Props = {
  datePairs: DatePair[];
};
