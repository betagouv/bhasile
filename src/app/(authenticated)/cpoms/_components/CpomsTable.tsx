"use client";

import { ReactElement } from "react";

import { ListTableHeadings } from "@/app/components/lists/ListTableHeadings";
import { CpomApiType } from "@/schemas/api/cpom.schema";
import { ListColumn } from "@/types/ListColumn";

import { CpomItem } from "./CpomItem";

const COLUMNS: ListColumn[] = [
  {
    label: "Opérateur",
    column: "operateur",
    orderBy: true,
    centered: false,
  },
  {
    label: "Structures",
    column: "structures",
    orderBy: true,
    centered: false,
  },
  {
    label: "Échelle",
    column: "granularity",
    orderBy: true,
    centered: false,
  },
  {
    label: "Région",
    column: "region",
    orderBy: true,
    centered: false,
  },
  {
    label: "Départements",
    column: "departements",
    orderBy: false,
    centered: false,
  },
  {
    label: "Date début",
    column: "dateStart",
    orderBy: true,
    centered: true,
  },
  {
    label: "Date fin",
    column: "dateEnd",
    orderBy: true,
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
  ariaLabelledBy: string;
};
