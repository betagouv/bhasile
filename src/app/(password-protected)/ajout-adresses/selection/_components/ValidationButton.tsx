import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useRouter } from "next/navigation";
import { ReactElement, useState } from "react";

import { useStructureAdresseExistence } from "@/app/hooks/useStructureAdresseExistence";
import { getErrorEmail } from "@/app/utils/errorMail.util";

const checkAdressesModal = createModal({
  id: "check-adresses-modal",
  isOpenedByDefault: false,
});
export const ValidationButton = ({
  selectedStructuresId,
}: Props): ReactElement => {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const { checkAdressesExistence } = useStructureAdresseExistence();

  const handleClick = async () => {
    try {
      const hasAdresses = await checkAdressesExistence(selectedStructuresId[0]);
      if (hasAdresses) {
        checkAdressesModal.open();
      } else {
        router.push(`/ajout-adresses/${selectedStructuresId[0]}/01-adresses`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
    }
  };

  return (
    <>
      <div className="flex justify-center">
        <Button
          type="button"
          onClick={handleClick}
          disabled={!selectedStructuresId.length}
          className="flex gap-2 mb-4"
        >
          J’ai trouvé ma structure{" "}
          <span className="fr-icon-arrow-right-line fr-icon--md" />
        </Button>
      </div>
      {error && (
        <p className="text-default-error m-0 p-0 text-center">
          Une erreur s’est produite.{" "}
          <a
            href={getErrorEmail(error, selectedStructuresId[0])}
            className="underline"
            target="_blank"
          >
            Nous prévenir
          </a>
        </p>
      )}
      <checkAdressesModal.Component
        title="Adresses déjà enregistrées"
        buttons={[
          {
            doClosesModal: true,
            children: "J’ai compris",
            type: "button",
          },
        ]}
      >
        <p>
          Vous n’êtes pas concerné par le problème technique, vos adresses sont
          bien enregistrées. Vous n’avez pas besoin de les saisir à nouveau.
        </p>
      </checkAdressesModal.Component>
    </>
  );
};

type Props = {
  selectedStructuresId: number[];
};
