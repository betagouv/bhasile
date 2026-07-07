"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { usePathname } from "next/navigation";
import { ReactElement } from "react";

import { UpcomingTransformationBadge } from "@/app/components/structures/UpcomingTransformationBadge";
import {
  CAMPAIGN_SAVE_KEY,
  useActualisationFormHandling,
} from "@/app/hooks/useActualisationFormHandling";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { isActualisationReadyToValidate } from "@/app/utils/actualisationForm.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { AutoSaveStatus } from "./AutoSaveStatus";
import {
  actualisationSuccessModal,
  autoSaveModal,
  finalisationSuccessModal,
} from "./StructureHeaderModals";
import { StructureMenu } from "./StructureMenu";

export const StructureHeaderActions = ({
  actualisationYear,
}: {
  actualisationYear: number | null;
}): ReactElement => {
  const { structure } = useStructureContext();
  const pathname = usePathname();

  const { handleFinalisation, isStructureReadyToFinalise } =
    useAgentFormHandling();
  const { handleValidateActualisation } = useActualisationFormHandling({
    year: actualisationYear ?? 0,
  });

  const isFinalisationPath = pathname.startsWith(
    `/structures/${structure?.id}/finalisation`
  );
  const isActualisationPath = pathname.startsWith(
    `/structures/${structure?.id}/actualisation`
  );

  if (isFinalisationPath) {
    return (
      <div className="flex items-center gap-3">
        <AutoSaveStatus onStatusClick={() => autoSaveModal.open()} />
        <Button
          disabled={!isStructureReadyToFinalise}
          onClick={async () => {
            if (await handleFinalisation()) {
              finalisationSuccessModal.open();
            }
          }}
        >
          Finaliser la création
        </Button>
      </div>
    );
  }

  if (isActualisationPath) {
    const isReadyToValidateActualisation = actualisationYear
      ? isActualisationReadyToValidate(structure, actualisationYear)
      : false;
    return (
      <div className="flex items-center gap-3">
        <AutoSaveStatus
          fetchStateKey={CAMPAIGN_SAVE_KEY}
          onStatusClick={() => autoSaveModal.open()}
        />
        <Button
          disabled={!isReadyToValidateActualisation}
          onClick={async () => {
            await handleValidateActualisation();
            actualisationSuccessModal.open();
          }}
        >
          Valider l’actualisation
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {structure.upcomingTransformations?.map((transformation) => (
        <UpcomingTransformationBadge
          key={`${transformation.kind}-${transformation.date}`}
          transformation={transformation}
        />
      ))}
      <StructureMenu structureId={structure.id} />
    </div>
  );
};
