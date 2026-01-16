import Tooltip from "@codegouvfr/react-dsfr/Tooltip";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureInCpom,
} from "@/app/utils/structure.util";
import { AUTORISEE_OPEN_YEAR, SUBVENTIONNEE_OPEN_YEAR } from "@/constants";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLine } from "./BudgetTableLine";
import { BudgetTableTitleLine } from "./BudgetTableTitleLine";
import { getBudgetTableHeading } from "./getBudgetTableHeading";

export const CpomTable = () => {
  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure?.type);

  const { years } = getYearRange({ order: "desc" });

  if (!structure.budgets) {
    return null;
  }

  const yearsInCpom = years.filter((year) =>
    isStructureInCpom(structure, year)
  );

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      headings={getBudgetTableHeading({ years, structure })}
      enableBorders
    >
      <BudgetTableTitleLine label="Budget" />
      <BudgetTableLine
        name="dotationDemandee"
        label="Dotation demandée"
        cpomStructures={structure.cpomStructures}
        enabledYears={yearsInCpom}
        disabledYearsStart={isAutorisee ? 0 : SUBVENTIONNEE_OPEN_YEAR + 1}
      />
      <BudgetTableLine
        name="dotationAccordee"
        label="Dotation accordée"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR + 1 : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableTitleLine label="Résultat" />
      <BudgetTableLine
        name="cumulResultatNet"
        label="Cumul des résultats"
        subLabel="des structures du CPOM"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="repriseEtat"
        label={
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
        }
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />

      <BudgetTableLine
        name="affectationReservesFondsDedies"
        label="Affectation"
        subLabel="réserves & fonds dédiés"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableTitleLine label="Détail affectation" />
      <BudgetTableLine
        name="reserveInvestissement"
        label="Réserve"
        subLabel="dédiée à l'investissement"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="chargesNonReconductibles"
        label="Charges"
        subLabel="non reductibles"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="reserveCompensationDeficits"
        label="Réserve de compensation "
        subLabel="des déficits"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="reserveCompensationBFR"
        label="Réserve de couverture"
        subLabel="de BFR"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="reserveCompensationAmortissements"
        label="Réserve de compensation"
        subLabel="des amortissements"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="fondsDedies"
        label="Fonds dédiés"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="reportANouveau"
        label="Report à nouveau"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="autre"
        label="Autre"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableCommentLine
        label="Commentaire"
        cpomStructures={structure.cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
    </Table>
  );
};
