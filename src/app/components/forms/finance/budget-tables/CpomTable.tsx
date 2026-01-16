import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import { useForm, useFormContext } from "react-hook-form";

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
  const parentFormContext = useFormContext();

  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure?.type);

  const { years } = getYearRange({ order: "desc" });

  const localForm = useForm();
  const { watch } = parentFormContext || localForm;

  const cpomStructures = watch("cpomStructures");

  const yearsInCpom = years.filter((year) =>
    isStructureInCpom(structure, year)
  );

  if (!cpomStructures) {
    return null;
  }

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
        cpomStructures={cpomStructures}
        enabledYears={yearsInCpom}
        disabledYearsStart={isAutorisee ? 0 : SUBVENTIONNEE_OPEN_YEAR + 1}
      />
      <BudgetTableLine
        name="dotationAccordee"
        label="Dotation accordée"
        cpomStructures={cpomStructures}
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
        cpomStructures={cpomStructures}
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
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />

      <BudgetTableLine
        name="affectationReservesFondsDedies"
        label="Affectation"
        subLabel="réserves & fonds dédiés"
        cpomStructures={cpomStructures}
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
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="chargesNonReconductibles"
        label="Charges"
        subLabel="non reductibles"
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="reserveCompensationDeficits"
        label="Réserve de compensation "
        subLabel="des déficits"
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="reserveCompensationBFR"
        label="Réserve de couverture"
        subLabel="de BFR"
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="reserveCompensationAmortissements"
        label="Réserve de compensation"
        subLabel="des amortissements"
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="fondsDedies"
        label="Fonds dédiés"
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="reportANouveau"
        label="Report à nouveau"
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableLine
        name="autre"
        label="Autre"
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
      <BudgetTableCommentLine
        label="Commentaire"
        cpomStructures={cpomStructures}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR + 1
        }
        enabledYears={yearsInCpom}
      />
    </Table>
  );
};
