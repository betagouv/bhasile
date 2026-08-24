"use client";

import { ReactElement } from "react";

import { Pagination } from "@/app/components/common/Pagination";
import { ListTableHeadings } from "@/app/components/lists/ListTableHeadings";
import { CpomListItem } from "@/types/cpom.type";

import { CpomItem } from "./CpomItem";
import { COLUMNS } from "./cpomsColumns";

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
  cpoms: CpomListItem[];
  totalCpoms: number;
  ariaLabelledBy: string;
};
