"use client";

import { ReactElement } from "react";

import { Pagination } from "@/app/components/common/Pagination";
import { ListTableHeadings } from "@/app/components/lists/ListTableHeadings";
import { isAgent } from "@/lib/casl";
import { CpomListItem } from "@/types/cpom.type";
import { SessionUser } from "@/types/global";

import { CpomItem } from "./CpomItem";
import { COLUMNS } from "./cpomsColumns";

export const CpomsTable = ({
  cpoms,
  totalCpoms,
  ariaLabelledBy,
  user,
}: Props): ReactElement => {
  const showOperateurColumn = isAgent(user);

  const visibleColumns = showOperateurColumn
    ? COLUMNS
    : COLUMNS.filter((column) => column.column !== "operateur");

  return (
    <div className="px-4 h-full">
      <ListTableHeadings
        ariaLabelledBy={ariaLabelledBy}
        columns={visibleColumns}
      >
        {cpoms.map((cpom, index) => (
          <CpomItem
            key={cpom.id}
            cpom={cpom}
            index={index}
            showOperateurColumn={showOperateurColumn}
          />
        ))}
      </ListTableHeadings>
      <div className="pt-4 flex justify-center items-center">
        <Pagination totalElements={totalCpoms} />
      </div>
    </div>
  );
};

type Props = {
  cpoms: CpomListItem[];
  totalCpoms: number;
  ariaLabelledBy: string;
  user?: SessionUser;
};
