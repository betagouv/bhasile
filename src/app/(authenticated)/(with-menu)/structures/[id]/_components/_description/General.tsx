import Link from "next/link";
import { ReactElement } from "react";

import { formatCityName } from "@/app/utils/adresse.util";
import { formatDate } from "@/app/utils/date.util";
import { PublicType } from "@/types/structure.type";

import { useStructureContext } from "../../_context/StructureClientContext";
import { CpomViewer } from "./CpomViewer";

export const General = (): ReactElement => {
  const { structure } = useStructureContext();

  const {
    codeBhasile,
    creationDate,
    operateurLabel,
    public: publicValue,
    type,
    lgbt,
    fvvTeh,
    nom,
    adresseAdministrative,
    codePostalAdministratif,
    communeAdministrative,
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
    <div className="grid grid-cols-2">
      <div className="flex gap-2 mb-3">
        <strong>Code Bhasile</strong>
        {codeBhasile}
      </div>
      <div className="flex gap-2 mb-3">
        <strong>Type de structure</strong>
        {type}
      </div>
      <hr className="col-span-2" />
      <div className="flex gap-2 mb-3">
        <strong>Opérateur</strong>
        {operateurLabel}
        <Link
          className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-right-line before:w-[20] before:h-[20] min-h-0 p-0"
          title={`Détails de l'opérateur ${operateurLabel}`}
          href={`/operateurs/${structure.operateur.id}`}
          aria-label={`Détails de l'opérateur ${operateurLabel}`}
        />
      </div>
      <div className="flex gap-2 mb-3">
        <strong>Type de bâti</strong>
        {structure.repartition}
      </div>
      <hr className="col-span-2" />
      <div className="flex gap-2 mb-3">
        <strong>Public</strong>
        {publicValue
          ? PublicType[String(publicValue) as keyof typeof PublicType]
          : "N/A"}
      </div>
      <div className="flex gap-2 mb-3">
        <strong>Vulnérabilité</strong>
        {getVulnerabiliteLabel()}
      </div>
      <hr className="col-span-2" />
      <div className="flex gap-2 mb-3">
        <strong>Date de création</strong>
        {formatDate(creationDate)}
      </div>
      <hr className="col-span-2" />
      <CpomViewer />
      <hr className="col-span-2" />
      <div className="col-span-2 flex gap-2">
        <strong>Adresse administrative</strong>
        <span>
          {nom ? `${nom}, ` : ""}
          {adresseAdministrative}, {codePostalAdministratif}{" "}
          {formatCityName(communeAdministrative ?? "")}
        </span>
      </div>
    </div>
  );
};
