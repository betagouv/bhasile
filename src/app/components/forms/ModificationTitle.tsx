import Button from "@codegouvfr/react-dsfr/Button";

export const ModificationTitle = ({ step, handleCancel }: Props) => {
  return (
    <div className="flex justify-between items-center mx-6 mt-3">
      <h1 className="text-xl font-bold mb-0 text-title-blue-france flex items-center gap-2">
        <span
          className="fr-icon-edit-line fr-icon--md before:h-5 before:w-5 mb-1"
          aria-hidden="true"
        />
        <span className="italic font-normal"> Modification</span> - {step}
      </h1>
      <Button
        onClick={handleCancel}
        aria-label="Fermer la modification"
        priority="tertiary no outline"
      >
        <span
          className="fr-icon-close-line fr-icon--md text-title-blue-france"
          aria-hidden="true"
        />
      </Button>
    </div>
  );
};

type Props = {
  step: string;
  handleCancel: () => void;
};
