import Button from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";
import { ReactElement } from "react";

export const BackButton = (): ReactElement => {
  const router = useRouter();

  const handleBack = () => {
    router.push("/ajout-structure");
  };
  return (
    <Button
      type="button"
      onClick={handleBack}
      className="fr-btn--tertiary-no-outline underline flex gap-1"
    >
      <span className="fr-icon-arrow-left-line fr-icon--sm " />
      Retour
    </Button>
  );
};
