import dayjs from "dayjs";

import { CpomDbList } from "@/app/api/cpoms/cpom.db.type";
import { resolveCurrentVersion } from "@/app/api/structure-versions/structure-version.util";
import {
  getDatesConvention,
  getDatesPeriodeAutorisation,
} from "@/app/api/structures/structure.util";
import { RAPPEL_TASK_LABEL } from "@/app/utils/rappel.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { canUpdateDepartement } from "@/lib/casl/abilities";
import {
  DashboardRappel,
  RappelCriticite,
  RappelTaskType,
} from "@/types/dashboard.type";
import { SessionUser } from "@/types/global";

import {
  AUTORISATION_ADVANCE_MONTHS,
  CONVENTION_ADVANCE_MONTHS,
  EVALUATION_ADVANCE_MONTHS,
  EVALUATION_PERIOD_YEARS,
  EVALUATION_PERIODS_COUNT,
} from "./rappels.constants";
import { RappelStructure } from "./rappels.db.type";

const getCriticiteForDeadline = (
  deadline: Date | null,
  advanceMonths: number,
  now: Date
): RappelCriticite | null => {
  if (!deadline) {
    return null;
  }
  if (deadline < now) {
    return "URGENT";
  }
  const windowStart = dayjs(deadline).subtract(advanceMonths, "month").toDate();
  return now > windowStart ? "IMPORTANT" : null;
};

const getMaxEvaluationDate = (
  evaluations: { date: Date | null }[]
): Date | null => {
  let mostRecent: Date | null = null;
  for (const evaluation of evaluations) {
    if (evaluation.date && (!mostRecent || evaluation.date > mostRecent)) {
      mostRecent = evaluation.date;
    }
  }
  return mostRecent;
};

const computeEvaluationRappel = (
  structure: RappelStructure,
  now: Date
): { criticite: RappelCriticite; deadline: Date | null } | null => {
  if (!isStructureAutorisee(structure.type)) {
    return null;
  }

  const [debutAutorisation] = getDatesPeriodeAutorisation(structure);
  if (!debutAutorisation) {
    return null;
  }

  const yearsSinceDebut = dayjs(now).diff(
    dayjs(debutAutorisation),
    "year",
    true
  );
  if (yearsSinceDebut < 0) {
    return null;
  }
  const periodIndex = Math.floor(yearsSinceDebut / EVALUATION_PERIOD_YEARS);
  if (periodIndex >= EVALUATION_PERIODS_COUNT) {
    return null;
  }

  const getPeriodStart = (index: number): Date =>
    dayjs(debutAutorisation)
      .add(index * EVALUATION_PERIOD_YEARS, "year")
      .toDate();
  const currentStart = getPeriodStart(periodIndex);
  const currentEnd = getPeriodStart(periodIndex + 1);
  const lastEvaluation = getMaxEvaluationDate(structure.evaluations);
  const hasNoEvaluationInCurrent =
    lastEvaluation === null || lastEvaluation < currentStart;

  if (periodIndex > 0) {
    const previousStart = getPeriodStart(periodIndex - 1);
    const hasNoEvaluationInPrevious =
      lastEvaluation === null || lastEvaluation < previousStart;
    if (hasNoEvaluationInPrevious && hasNoEvaluationInCurrent) {
      return { criticite: "URGENT", deadline: currentStart };
    }
  }

  const alertThreshold = dayjs(currentEnd)
    .subtract(EVALUATION_ADVANCE_MONTHS, "month")
    .toDate();
  if (hasNoEvaluationInCurrent && now > alertThreshold) {
    return { criticite: "IMPORTANT", deadline: currentEnd };
  }

  return null;
};

type CurrentCpom = { id: number; label: string | null; departements: string[] };

const findCurrentCpom = (
  cpomStructures: RappelStructure["cpomStructures"],
  now: Date
): CurrentCpom | null => {
  for (const cpomStructure of cpomStructures) {
    const cpom = cpomStructure.cpom;
    if (!cpom) {
      continue;
    }
    const [conventionStart, conventionEnd] = getDatesConvention(cpom);
    const start = cpomStructure.dateStart ?? conventionStart;
    const end = cpomStructure.dateEnd ?? conventionEnd;
    if (start && end && start <= now && end >= now) {
      return {
        id: cpom.id,
        label: cpom.name ?? cpom.operateur?.name ?? null,
        departements: cpom.departements.map(
          (cpomDepartement) => cpomDepartement.departement.numero
        ),
      };
    }
  }
  return null;
};

const getEvaluationLabel = (criticite: RappelCriticite): string =>
  criticite === "URGENT" ? "Évaluation à mener" : "Évaluation à lancer";

export type BuildRappelsOptions = {
  user: SessionUser;
  departementList: string[];
  operateurList: string[];
  typeList: string[];
  now: Date;
};

export const buildRappels = (
  structures: RappelStructure[],
  cpoms: CpomDbList[],
  options: BuildRappelsOptions
): DashboardRappel[] => {
  const { user, departementList, operateurList, typeList, now } = options;
  const rappels: DashboardRappel[] = [];

  for (const structure of structures) {
    if (!structure.forms[0]?.status) {
      continue;
    }
    const departement = structure.departementAdministratif;
    if (!departement || !canUpdateDepartement(user, departement)) {
      continue;
    }
    if (departementList.length > 0 && !departementList.includes(departement)) {
      continue;
    }
    const operateurId = structure.operateur?.id ?? null;
    if (
      operateurList.length > 0 &&
      (operateurId === null || !operateurList.includes(String(operateurId)))
    ) {
      continue;
    }
    if (
      typeList.length > 0 &&
      (structure.type === null || !typeList.includes(structure.type))
    ) {
      continue;
    }

    const currentCpom = findCurrentCpom(structure.cpomStructures, now);
    const context = {
      structureId: structure.id,
      structureCodeBhasile: structure.codeBhasile,
      structureType: structure.type,
      structureCommune:
        resolveCurrentVersion(structure.structureVersions, now)
          ?.communeAdministrative ?? null,
      structureDepartement: departement,
      operateurName: structure.operateur?.name ?? null,
      cpomId: currentCpom?.id ?? null,
      cpomLabel: currentCpom?.label ?? null,
      cpomDepartements: currentCpom?.departements ?? [],
      actionUrl: `/structures/${structure.id}`,
    };

    const pushStructureRappel = (
      taskType: RappelTaskType,
      taskLabel: string,
      deadline: Date | null,
      criticite: RappelCriticite
    ): void => {
      rappels.push({
        id: `STRUCTURE-${taskType}-${structure.id}`,
        echelle: "STRUCTURE",
        taskType,
        taskLabel,
        deadline: deadline ? deadline.toISOString() : null,
        criticite,
        ...context,
      });
    };

    const [, finAutorisation] = getDatesPeriodeAutorisation(structure);
    const critAutorisation = getCriticiteForDeadline(
      finAutorisation,
      AUTORISATION_ADVANCE_MONTHS,
      now
    );
    if (critAutorisation) {
      pushStructureRappel(
        "RENOUVELLEMENT_AUTORISATION",
        RAPPEL_TASK_LABEL.RENOUVELLEMENT_AUTORISATION,
        finAutorisation,
        critAutorisation
      );
    }

    const [, finConvention] = getDatesConvention(structure);
    const critConvention = getCriticiteForDeadline(
      finConvention,
      CONVENTION_ADVANCE_MONTHS,
      now
    );
    if (critConvention) {
      pushStructureRappel(
        "RENOUVELLEMENT_CONVENTION",
        RAPPEL_TASK_LABEL.RENOUVELLEMENT_CONVENTION,
        finConvention,
        critConvention
      );
    }

    const evaluationRappel = computeEvaluationRappel(structure, now);
    if (evaluationRappel) {
      pushStructureRappel(
        "EVALUATION",
        getEvaluationLabel(evaluationRappel.criticite),
        evaluationRappel.deadline,
        evaluationRappel.criticite
      );
    }
  }

  for (const cpom of cpoms) {
    const departements = cpom.departements.map(
      (cpomDepartement) => cpomDepartement.departement.numero
    );
    if (!departements.some((dept) => canUpdateDepartement(user, dept))) {
      continue;
    }
    if (
      departementList.length > 0 &&
      !departements.some((dept) => departementList.includes(dept))
    ) {
      continue;
    }
    const operateurId = cpom.operateur?.id ?? null;
    if (
      operateurList.length > 0 &&
      (operateurId === null || !operateurList.includes(String(operateurId)))
    ) {
      continue;
    }

    const [, dateEnd] = getDatesConvention(cpom);
    const criticite = getCriticiteForDeadline(
      dateEnd,
      CONVENTION_ADVANCE_MONTHS,
      now
    );
    if (!criticite) {
      continue;
    }

    rappels.push({
      id: `CPOM-RENOUVELLEMENT_CPOM-${cpom.id}`,
      echelle: "CPOM",
      taskType: "RENOUVELLEMENT_CPOM",
      taskLabel: RAPPEL_TASK_LABEL.RENOUVELLEMENT_CPOM,
      deadline: dateEnd ? dateEnd.toISOString() : null,
      criticite,
      actionUrl: `/cpoms/${cpom.id}`,
      structureId: null,
      structureCodeBhasile: null,
      structureType: null,
      structureCommune: null,
      structureDepartement: null,
      operateurName: cpom.operateur?.name ?? null,
      cpomId: cpom.id,
      cpomLabel: cpom.name ?? cpom.operateur?.name ?? null,
      cpomDepartements: departements,
    });
  }

  return rappels;
};
