"use client";

import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { computeCpomDates, getGranularityLabel } from "@/app/utils/cpom.util";
import { formatDate } from "@/app/utils/date.util";

import { useCpomContext } from "../../_context/CpomClientContext";

export const DescriptionBlock = () => {
  const { cpom } = useCpomContext();
  const router = useRouter();

  const { dateStart, dateEnd } = computeCpomDates(cpom);

  return (
    <Block
      title="Description"
      iconClass="fr-icon-align-left"
      onEdit={() => {
        router.push(`/cpoms/${cpom.id}/modification/description`);
      }}
    >
      <div className="grid grid-cols-2">
        <div className="flex gap-2 mb-3">
          <strong>Opérateur</strong>
          {cpom.operateur?.name}
        </div>
        <div className="flex gap-2 mb-3">
          <strong>Échelle</strong>
          {getGranularityLabel(cpom)}
        </div>
        <hr className="col-span-2" />
        <div className="flex gap-2 mb-3">
          <strong>Région</strong>
          {cpom.region}
        </div>
        <div className="flex gap-2 mb-3">
          <strong>Département</strong>
          {cpom.departements?.join(", ")}
        </div>
        <hr className="col-span-2" />
        <div className="flex gap-2 mb-3">
          <strong>Date début</strong>
          {formatDate(dateStart)}
        </div>
        <div className="flex gap-2 mb-3">
          <strong>Date fin</strong>
          {formatDate(dateEnd)}
        </div>
      </div>
    </Block>
  );
};
