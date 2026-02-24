import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

export const AffectationTooltip = () => {
  return (
    <Tooltip
      title={
        <>
          <span>Négatif : affectation d’un déficit</span>
          <br />
          <span>Positif : affectation d’un excédent</span>
        </>
      }
    >
      Affectation{" "}
      <i className="fr-icon-information-line before:scale-50 before:origin-left" />
    </Tooltip>
  );
};
