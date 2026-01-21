import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

export const BudgetTableRepriseEtatTooltip = () => {
  return (
    <Tooltip
      title={
        <>
          <span>Négatif : reprise excédent</span>
          <br />
          <span>Positif : compensation déficit</span>
        </>
      }
    >
      Reprise état{" "}
      <i className="fr-icon-information-line before:scale-50 before:origin-left" />
    </Tooltip>
  );
};
