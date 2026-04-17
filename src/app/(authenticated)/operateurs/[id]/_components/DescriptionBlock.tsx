"use client";

import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";

import { useOperateurContext } from "../_context/OperateurClientContext";

export const DescriptionBlock = () => {
  const router = useRouter();
  const { operateur } = useOperateurContext();

  return (
    <Block
      title="Description"
      iconClass="fr-icon-align-left"
      onEdit={() => {
        router.push(`/operateurs/${operateur.id}/modification/description`);
      }}
      entity={operateur}
      entityType="Operateur"
    >
      <div className="grid grid-cols-2">
        <div className="flex gap-2 mb-3">
          <strong>Direction générale</strong>
          {operateur?.directionGenerale || "N/A"}
        </div>
        <div className="flex gap-2 mb-3">
          <strong>SIRET</strong>
          {operateur?.siret || "N/A"}
        </div>
        <hr className="col-span-2" />
        <div className="flex gap-2 mb-3">
          <strong>Vulnérabilité</strong>
          {operateur?.vulnerabilites?.join(", ") || "N/A"}
        </div>
        <hr className="col-span-2" />
        <div className="flex gap-2 mb-3">
          <strong>Siège social</strong>
          {operateur?.siegeSocial || "N/A"}
        </div>
      </div>
    </Block>
  );
};
