"use client";

import { ReactElement } from "react";

import { Pagination } from "@/app/components/common/Pagination";
import { ListTableHeadings } from "@/app/components/lists/ListTableHeadings";
import { CpomApiRead } from "@/schemas/api/cpom.schema";
import { ListColumn } from "@/types/ListColumn";

import { CpomItem } from "./CpomItem";

const COLUMNS: ListColumn[] = [
  {
    label: "Opérateur",
    column: "operateur",
    orderBy: true,
  },
  {
    label: "Structures",
    column: "structures",
    orderBy: true,
  },
  {
    label: "Échelle",
    column: "granularity",
    orderBy: true,
  },
  {
    label: "Région",
    column: "region",
    orderBy: true,
  },
  {
    label: "Départements",
    column: "departements",
    orderBy: false,
  },
  {
    label: "Date début",
    column: "dateStart",
    orderBy: true,
  },
  {
    label: "Date fin",
    column: "dateEnd",
    orderBy: true,
  },
];

export const CpomsTable = ({
  cpoms,
  totalCpoms,
  ariaLabelledBy,
}: Props): ReactElement => {
  return (
    <>
      <div className="px-4 h-full">
        <ListTableHeadings ariaLabelledBy={ariaLabelledBy} columns={COLUMNS}>
          {cpoms.map((cpom, index) => (
            <CpomItem key={cpom.id} cpom={cpom} index={index} />
          ))}
        </ListTableHeadings>
        <div className="pt-4 flex justify-center items-center">
          <Pagination totalElements={totalCpoms} />
        </div>
      </div>
    </>
  );
};

type Props = {
  cpoms: CpomApiRead[];
  totalCpoms: number;
  ariaLabelledBy: string;
};
