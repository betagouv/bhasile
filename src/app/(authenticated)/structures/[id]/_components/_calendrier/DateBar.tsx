"use client";

import dayjs from "dayjs";
import { ReactElement, useEffect, useState } from "react";

import { Badge } from "@/app/components/common/Badge";
import { formatDate, getElapsedPercentage } from "@/app/utils/date.util";

export const DateBar = ({ datePair }: Props): ReactElement => {
  const [percentage, setPercentage] = useState<number | null>(null);

  useEffect(() => {
    const percentage = getElapsedPercentage(datePair);
    setPercentage(percentage);
  }, [datePair]);

  const isLessThan3Months = dayjs(datePair.dateEnd).diff(dayjs(), "month") < 3;
  const isConventionExpiree = dayjs(datePair.dateEnd).isBefore(dayjs());

  return (
    <>
      <div className="flex-1 flex items-center">
        <span className="inline-block w-24 shrink-0">
          {formatDate(datePair.dateStart)}
        </span>
        <div className="relative flex-1 bg-background-disabled-grey h-[10px] rounded-[5px] mr-4">
          <div
            className="absolute top-0 left-0 h-full rounded-[5px] bg-(--yellow-moutarde-850-200)"
            style={{ width: `${percentage?.toFixed(3)}%` }}
          />
        </div>
      </div>
      <div className="w-44 flex items-center">
        <span className="inline-block w-24 shrink-0">
          {formatDate(datePair.dateEnd)}
        </span>
        {!isConventionExpiree && isLessThan3Months && (
          <div className="pl-2">
            <Badge type="warning" icon={true}>
              {"<"}&nbsp;3&nbsp;mois
            </Badge>
          </div>
        )}
        {isConventionExpiree && (
          <div className="pl-2">
            <Badge type="warning" icon={true}>
              Expirée
            </Badge>
          </div>
        )}
      </div>
    </>
  );
};

type Props = {
  datePair: DatePair;
};

export type DatePair = {
  dateStart: string;
  dateEnd: string;
  label: string;
};
