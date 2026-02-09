"use client";

import { ReactElement } from "react";

import { ListTableHeadings } from "@/app/components/lists/ListTableHeadings";
import { CpomApiType } from "@/schemas/api/cpom.schema";
import { ListColumn } from "@/types/ListColumn";

import { CpomItem } from "./CpomItem";

const COLUMNS: ListColumn[] = [
  {
    label: "Operateur",
    column: "operateur",
    orderBy: false,
    centered: false,
  },
  {
    label: "Échelle",
    column: "granularity",
    orderBy: false,
    centered: false,
  },
  {
    label: "Région",
    column: "region",
    orderBy: false,
    centered: false,
  },
  {
    label: "Départements",
    column: "departements",
    orderBy: false,
    centered: false,
  },
  {
    label: "Année de début",
    column: "dateStart",
    orderBy: false,
    centered: true,
  },
  {
    label: "Année de fin",
    column: "dateEnd",
    orderBy: false,
    centered: true,
  },
];

export const CpomsTable = ({ cpoms, ariaLabelledBy }: Props): ReactElement => {
  return (
    <>
      <div className="p-4 bg-alt-grey h-full">
        <ListTableHeadings ariaLabelledBy={ariaLabelledBy} columns={COLUMNS}>
          {cpoms.map((cpom, index) => (
            <CpomItem key={cpom.id} cpom={cpom} index={index} />
          ))}
        </ListTableHeadings>
      </div>
    </>
  );
};

type Props = {
  cpoms: CpomApiType[];
  totalCpoms: number;
  ariaLabelledBy: string;
};
