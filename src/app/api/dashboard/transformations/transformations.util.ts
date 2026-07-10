import { compareSortValues } from "@/app/utils/list.util";
import { formatPlural } from "@/app/utils/string.util";
import {
  getReferenceStructureVersionTransformation,
  getStructureVersionTransformationDepartement,
  getStructureVersionTransformationOperateur,
} from "@/app/utils/transformation.util";
import { STRUCTURE_VERSION_TRANSFORMATION_TYPE_ORDER } from "@/config/transformation.config";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import {
  DashboardTransformationRow,
  DashboardTransformationStatus,
} from "@/types/dashboard.type";
import { StepStatus } from "@/types/form.type";
import { StructureVersionTransformationType } from "@/types/transformation.type";

export const getTransformationStatus = (
  transformation: TransformationApiRead
): DashboardTransformationStatus => {
  const hasStartedStep = transformation.structureVersionTransformations
    .flatMap(
      (structureVersionTransformation) =>
        structureVersionTransformation.form?.formSteps ?? []
    )
    .some((formStep) => formStep.status !== StepStatus.NON_COMMENCE);

  return hasStartedStep ? "A_FINALISER" : "A_INITIALISER";
};

const SUMMARY_LABEL: Record<StructureVersionTransformationType, string> = {
  [StructureVersionTransformationType.CREATION]: "création",
  [StructureVersionTransformationType.FERMETURE]: "fermeture",
  [StructureVersionTransformationType.CONTRACTION]: "contraction",
  [StructureVersionTransformationType.EXTENSION]: "extension",
};

type SummaryGroup = {
  type: StructureVersionTransformationType;
  structureType: string | null;
  count: number;
};

export const buildTransformationSummary = (
  structureVersionTransformations: StructureVersionTransformationApiRead[]
): string => {
  const groups = new Map<string, SummaryGroup>();

  for (const structureVersionTransformation of structureVersionTransformations) {
    const structureType = structureVersionTransformation.structureType ?? null;
    const key = `${structureVersionTransformation.type}__${structureType ?? ""}`;
    const existingGroup = groups.get(key);
    if (existingGroup) {
      existingGroup.count += 1;
    } else {
      groups.set(key, {
        type: structureVersionTransformation.type,
        structureType,
        count: 1,
      });
    }
  }

  return [...groups.values()]
    .sort(
      (firstGroup, secondGroup) =>
        STRUCTURE_VERSION_TRANSFORMATION_TYPE_ORDER[firstGroup.type] -
          STRUCTURE_VERSION_TRANSFORMATION_TYPE_ORDER[secondGroup.type] ||
        compareSortValues(
          firstGroup.structureType,
          secondGroup.structureType,
          "asc",
          "text"
        )
    )
    .map((group) => {
      const label = formatPlural(group.count, SUMMARY_LABEL[group.type]);
      return group.structureType ? `${label} (${group.structureType})` : label;
    })
    .join(" et ");
};

const STATUS_RANK: Record<DashboardTransformationStatus, number> = {
  A_FINALISER: 0,
  A_INITIALISER: 1,
};

export const sortDashboardTransformationRows = (
  rows: DashboardTransformationRow[]
): DashboardTransformationRow[] =>
  [...rows].sort(
    (firstRow, secondRow) =>
      compareSortValues(
        STATUS_RANK[firstRow.status],
        STATUS_RANK[secondRow.status],
        "asc",
        "number"
      ) ||
      compareSortValues(
        firstRow.operateurName,
        secondRow.operateurName,
        "asc",
        "text"
      ) ||
      compareSortValues(
        firstRow.transformationId,
        secondRow.transformationId,
        "asc",
        "number"
      )
  );

export type BuildDashboardTransformationRowsOptions = {
  departementList: string[];
  operateurList: string[];
  typeList: string[];
};

export const buildDashboardTransformationRows = (
  transformations: TransformationApiRead[],
  options: BuildDashboardTransformationRowsOptions
): DashboardTransformationRow[] => {
  const rows: DashboardTransformationRow[] = [];

  for (const transformation of transformations) {
    const referenceStructureVersionTransformation =
      getReferenceStructureVersionTransformation(transformation);
    const departement = getStructureVersionTransformationDepartement(
      referenceStructureVersionTransformation
    );
    if (!departement) {
      continue;
    }
    if (
      options.departementList.length > 0 &&
      !options.departementList.includes(departement)
    ) {
      continue;
    }

    const operateur = getStructureVersionTransformationOperateur(
      referenceStructureVersionTransformation
    );
    const operateurId = operateur?.id ?? null;
    if (
      options.operateurList.length > 0 &&
      (operateurId === null ||
        !options.operateurList.includes(String(operateurId)))
    ) {
      continue;
    }

    if (
      options.typeList.length > 0 &&
      !transformation.structureVersionTransformations.some(
        (structureVersionTransformation) =>
          structureVersionTransformation.structureType &&
          options.typeList.includes(
            structureVersionTransformation.structureType
          )
      )
    ) {
      continue;
    }

    const status = getTransformationStatus(transformation);
    rows.push({
      transformationId: transformation.id,
      operateurName: operateur?.name ?? null,
      departementAdministratif: departement,
      summary: buildTransformationSummary(
        transformation.structureVersionTransformations
      ),
      status,
      updatedAt:
        status === "A_FINALISER" ? (transformation.updatedAt ?? null) : null,
      actionUrl: `/structures/transformation/${transformation.id}`,
    });
  }

  return sortDashboardTransformationRows(rows);
};
