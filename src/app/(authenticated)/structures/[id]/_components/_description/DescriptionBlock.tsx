import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { useRouter } from "next/navigation";
import { ReactElement, useState } from "react";

import { Block } from "@/app/components/common/Block";
import { formatDate } from "@/app/utils/date.util";
import { getOperateurLabel } from "@/app/utils/structure.util";
import { PublicType } from "@/types/structure.type";

import { useStructureContext } from "../../_context/StructureClientContext";
import { AdressesViewer } from "./AdressesViewer";
import { ContactsViewer } from "./ContactsViewer";
import { CpomViewer } from "./CpomViewer";

const TABS = [
  {
    id: "general",
    label: "Général",
  },
  {
    id: "sites",
    label: "Sites et contacts",
  },
  {
    id: "codes",
    label: "Codes DNA & FINESS",
  },
  {
    id: "adresses",
    label: "Adresses d'hébergement",
  },
] as const;

export const DescriptionBlock = (): ReactElement => {
  const { structure } = useStructureContext();
  const router = useRouter();
  const {
    creationDate,
    filiale,
    operateur,
    public: publicValue,
    type,
    lgbt,
    fvvTeh,
  } = structure;

  const [selectedTabId, setSelectedTabId] = useState<
    (typeof TABS)[number]["id"]
  >(TABS[0].id);

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
      iconClass="fr-icon-menu-2-fill"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/01-description`);
      }}
    >
      <Tabs
        selectedTabId={selectedTabId}
        tabs={TABS.map((tab) => ({
          tabId: tab.id,
          label: tab.label,
        }))}
        onTabChange={(params) =>
          setSelectedTabId(params as (typeof TABS)[number]["id"])
        }
      >
        <div className="flex mb-2">
          <div className="flex-1">
            <strong className="pr-2">Date de création</strong>
            {formatDate(creationDate)}
          </div>
          <div className="flex-1">
            <strong className="pr-2">Type de structure</strong>
            {type}
          </div>
        </div>
        <hr />
        <div className="flex mb-2">
          <div className="flex-1">
            <strong className="pr-2">Opérateur</strong>
            {getOperateurLabel(filiale, operateur?.name)}
          </div>
        </div>
        <hr />
        <div className="flex mb-2">
          <div className="flex-1">
            <strong className="pr-2">Public</strong>
            {PublicType[String(publicValue) as keyof typeof PublicType]}
          </div>
          <div className="flex-1">
            <strong className="pr-2">Vulnérabilité</strong>
            {getVulnerabiliteLabel()}
          </div>
        </div>
        <hr />
        <div className="mb-2">
          <CpomViewer />
        </div>
        <hr />
        <div className="mb-2">
          <ContactsViewer />
        </div>
        <hr />
        <div>
          <AdressesViewer />
        </div>
      </Tabs>
    </Block>
  );
};
