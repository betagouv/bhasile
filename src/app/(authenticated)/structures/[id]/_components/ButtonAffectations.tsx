import Button from "@codegouvfr/react-dsfr/Button";

export const ButtonAffectations = ({
  isAffectationOpen,
  setIsAffectationOpen,
}: Props) => {
  return (
    <Button
      priority="tertiary no outline"
      onClick={() => setIsAffectationOpen(!isAffectationOpen)}
      iconId={isAffectationOpen ? "fr-icon-eye-off-line" : "fr-icon-eye-line"}
      className="mt-4 ml-16"
      size="small"
    >
      {isAffectationOpen ? "Masquer" : "Voir"} le détail des affectations
    </Button>
  );
};

type Props = {
  isAffectationOpen: boolean;
  setIsAffectationOpen: (isAffectationOpen: boolean) => void;
};
