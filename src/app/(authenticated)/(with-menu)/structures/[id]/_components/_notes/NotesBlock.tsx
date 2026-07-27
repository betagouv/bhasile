import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { useCanUpdateStructure } from "@/app/hooks/useCanUpdateStructure";

import { useStructureContext } from "../../_context/StructureClientContext";

export const NotesBlock = (): ReactElement | null => {
  const { structure } = useStructureContext();
  const canEdit = useCanUpdateStructure(structure);

  const router = useRouter();

  if (!canEdit) {
    return null;
  }

  return (
    <Block
      entity={structure}
      entityType="Structure"
      iconClass="fr-icon-message-2-line"
      title="Notes"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/notes`);
      }}
    >
      <span className="whitespace-pre-wrap">
        {structure.notes || "Aucune note renseignée"}
      </span>
    </Block>
  );
};
