"use client";

import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { getDepartementsList, getGranularityLabel } from "@/app/utils/cpom.util";
import { formatDate } from "@/app/utils/date.util";

import { useCpomContext } from "../_context/CpomClientContext";

export const DescriptionBlock = () => {
  const { cpom } = useCpomContext();
  const router = useRouter();

  return (
    <Block
      title="Description"
      iconClass="fr-icon-align-left"
      onEdit={() => {
        router.push(`/cpoms/${cpom.id}/modification/description`);
      }}
      entity={cpom}
      entityType="Cpom"
    >
      <div className="grid grid-cols-2">
        <div className="flex gap-2 mb-3">
          <strong>Opérateur</strong>
          {cpom.operateur?.name}
        </div>
        <div className="flex gap-2 mb-3">
          <strong>Échelle</strong>
          {getGranularityLabel(cpom.granularity)}
        </div>
        <hr className="col-span-2" />
        <div className="flex gap-2 mb-3">
          <strong>Région</strong>
          {cpom.region?.name}
        </div>
        {cpom.granularity !== "REGIONALE" && (
          <div className="flex gap-2 mb-3">
            <strong>
              Département
              {cpom.departements?.length && cpom.departements?.length > 1
                ? "s"
                : ""}
            </strong>
            {getDepartementsList(cpom.departements)}
          </div>
        )}
        <hr className="col-span-2" />
        <div className="flex gap-2 mb-3">
          <strong>Date début</strong>
          {formatDate(cpom.dateStart)}
        </div>
        <div className="flex gap-2 mb-3">
          <strong>Date fin</strong>
          {formatDate(cpom.dateEnd)}
        </div>
      </div>
    </Block>
  );
};
