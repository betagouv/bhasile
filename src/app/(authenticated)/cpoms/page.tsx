"use client";

import Link from "next/link";
import { ReactElement } from "react";

import { Filters } from "@/app/components/filters/Filters";
import { ListLoader } from "@/app/components/lists/ListLoader";
import { useCpomsSearch } from "@/app/hooks/useCpomsSearch";

import { CpomsTable } from "./_components/CpomsTable";

export default function Structures(): ReactElement {
  const { cpoms, totalCpoms } = useCpomsSearch();

  return (
    <div className="h-full w-full flex flex-col bg-alt-grey">
      <div className="flex gap-2 px-6 border-b border-b-border-default-grey min-h-[4.35rem] justify-between items-center sticky top-0 bg-lifted-grey z-10">
        <h2 className="text-title-blue-france fr-h5 mr-4 mb-0" id="cpoms-titre">
          CPOM
        </h2>
        <Link
          href="/cpoms/ajout/01-identification"
          className="fr-btn fr-btn--secondary"
        >
          <span className="fr-icon-add-line fr-icon--sm" /> Créer un CPOM
        </Link>
      </div>
      <div className="flex gap-2 justify-end items-center py-3.5 px-6 z-2">
        <Filters showFilters={false} showLocation={true} />
        <p className="pl-3 text-mention-grey mb-0 min-w-24 text-right">
          {totalCpoms ?? 0} entrée
          {(totalCpoms ?? 0) > 1 ? "s" : ""}
        </p>
      </div>
      <ListLoader
        fetchStateName={"cpoms-search"}
        items={cpoms}
        entity="cpom"
      >
        {cpoms && (
          <CpomsTable
            cpoms={cpoms}
            totalCpoms={totalCpoms}
            ariaLabelledBy="cpoms-titre"
          />
        )}
      </ListLoader>
    </div>
  );
}
