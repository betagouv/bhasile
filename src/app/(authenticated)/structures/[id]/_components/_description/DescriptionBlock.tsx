import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { useRouter } from "next/navigation";
import { ReactElement, useState } from "react";

import { Block } from "@/app/components/common/Block";
import {
  isStructureAutorisee,
  isStructureMultiAntenne,
} from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { Adresses } from "./Adresses";
import { AntennesAndContacts } from "./AntennesAndContacts";
import { Codes } from "./Codes";
import { General } from "./General";

export const DescriptionBlock = (): ReactElement => {
  const { structure } = useStructureContext();
  const router = useRouter();

  const isAutorisee = isStructureAutorisee(structure.type);
  const isMultiAntennes = isStructureMultiAntenne(structure);
  const tabs = [
    {
      id: "general",
      label: "Général",
    },
    {
      id: "sites",
      label: isMultiAntennes ? "Sites et contacts" : "Contacts",
    },
    {
      id: "codes",
      label: isAutorisee ? "Codes DNA & FINESS" : "Codes DNA",
    },
    {
      id: "adresses",
      label: "Adresses d'hébergement",
    },
  ];

  const [selectedTabId, setSelectedTabId] = useState<string>("general");

  return (
    <Block
      title="Description"
      iconClass="fr-icon-align-left"
      multipleEdit={[
        {
          label: (
            <span>
              Modifier{" "}
              <span className="italic">Général, contacts et codes</span>
            </span>
          ),
          onClick: () => {
            router.push(`/structures/${structure.id}/modification/description`);
          },
        },
        {
          label: (
            <span>
              Modifier <span className="italic">Adresses d’hébergement</span>
            </span>
          ),
          onClick: () => {
            router.push(`/structures/${structure.id}/modification/adresses`);
          },
        },
      ]}
    >
      <Tabs
        selectedTabId={selectedTabId}
        tabs={tabs.map((tab) => ({
          tabId: tab.id,
          label: tab.label,
        }))}
        onTabChange={(tabId) => setSelectedTabId(tabId)}
      >
        {selectedTabId === "general" && <General />}
        {selectedTabId === "sites" && <AntennesAndContacts />}
        {selectedTabId === "codes" && <Codes />}
        {selectedTabId === "adresses" && <Adresses />}
      </Tabs>
    </Block>
  );
};
