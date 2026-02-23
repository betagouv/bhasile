export const ModificationTitle = ({ step, closeLink }: Props) => {
  return (
    <div className="flex justify-between items-center mx-6 my-3">
      <h1 className="text-xl font-bold mb-0 text-title-blue-france flex items-center gap-2">
        <span
          className="fr-icon-edit-line fr-icon--md before:h-5 before:w-5 mb-1"
          aria-hidden="true"
        />
        <span className="italic font-normal"> Modification</span> - {step}
      </h1>
      <a href={closeLink} aria-label="Fermer la modification">
        <span
          className="fr-icon-close-line fr-icon--md text-title-blue-france"
          aria-hidden="true"
        />
      </a>
    </div>
  );
};

type Props = {
  step: string;
  closeLink: string;
};
