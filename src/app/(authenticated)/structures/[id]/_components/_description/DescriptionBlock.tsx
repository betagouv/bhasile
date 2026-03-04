import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { formatDate } from "@/app/utils/date.util";
import { getOperateurLabel } from "@/app/utils/structure.util";
import { PublicType } from "@/types/structure.type";

import { useStructureContext } from "../../_context/StructureClientContext";
import { AdressesViewer } from "./AdressesViewer";
import { ContactsViewer } from "./ContactsViewer";
import { CpomViewer } from "./CpomViewer";

export const DescriptionBlock = (): ReactElement => {
  const { structure } = useStructureContext();
  const router = useRouter();
  const {
    creationDate,
    dnaCode,
    filiale,
    operateur,
    public: publicValue,
    type,
    finessCode,
    lgbt,
    fvvTeh,
  } = structure;

  const getVulnerabiliteLabel = () => {
    const vulnerabilites: string[] = [];
    if (lgbt) {
      vulnerabilites.push("LGBT");
    }
    if (fvvTeh) {
      vulnerabilites.push("FVV", "TEH");
    }
    return vulnerabilites.join(", ") || "N/A";
  };

  return (
    <Block
      title="Description"
      iconClass="fr-icon-align-left"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/01-description`);
      }}
    >
      <div className="flex mb-2.5">
        <div className="flex-1">
          <strong className="pr-2">Date de création</strong>
          {formatDate(creationDate)}
        </div>
        <div className="flex-1">
          <strong className="pr-2">Type de structure</strong>
          {type}
        </div>
      </div>
      <hr className="pb-2.5!" />
      <div className="flex mb-2.5">
        <div className="flex-1">
          <strong className="pr-2">Code DNA (OFII)</strong>
          {dnaCode}
        </div>
        {finessCode && (
          <div className="flex-1">
            <strong className="pr-2">Code FINESS</strong>
            {finessCode.replaceAll(" ", "")}
          </div>
        )}
      </div>
      <hr className="pb-2.5!" />
      <div className="flex mb-2.5">
        <div className="flex-1">
          <strong className="pr-2">Opérateur</strong>
          {getOperateurLabel(filiale, operateur?.name)}
        </div>
      </div>
      <hr className="pb-2.5!" />
      <div className="flex mb-2.5">
        <div className="flex-1">
          <strong className="pr-2">Public</strong>
          {PublicType[String(publicValue) as keyof typeof PublicType]}
        </div>
        <div className="flex-1">
          <strong className="pr-2">Vulnérabilité</strong>
          {getVulnerabiliteLabel()}
        </div>
      </div>
      <hr className="pb-1.5!" />
      <div className="mb-1.5">
        <CpomViewer />
      </div>
      <hr className="pb-1.5!" />
      <div className="mb-1.5">
        <ContactsViewer />
      </div>
      <hr className="pb-1.5!" />
      <div className="mb-1.5">
        <AdressesViewer />
      </div>
    </Block>
  );
};
