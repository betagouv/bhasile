"use client";

import { ReactElement } from "react";

import { AnnualDataNote } from "../AnnualDataNote";
import { StructuresStatsTable } from "./StructuresStatsTable";
import { TypesBatis } from "./TypesBatis";
import { TypesStructures } from "./TypesStructures";

export const StructuresBlock = (): ReactElement => {
  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className="text-title-blue-france mr-3 fr-icon-community-line" />
          <h3 className="text-title-blue-france fr-h6 mb-12">Structures</h3>
        </div>
      </div>
      <div className="grid grid-cols-2">
        <div className="border-r border-default-grey mr-10">
          <TypesStructures />
        </div>
        <TypesBatis />
      </div>
      <div className="pt-16">
        <StructuresStatsTable />
      </div>
      <AnnualDataNote />
    </div>
  );
};
