import { decimalToNumber } from "@/app/utils/decimal.util";
import {
  average,
  roundTo,
  sumValues,
  weightedAverage,
} from "@/app/utils/math.util";
import { Activite } from "@/generated/prisma/client";

import { resolveCurrentVersion } from "../structure-versions/structure-version.util";
import { StructureListLight } from "../structures/structure.db.type";
import { ActiviteStats } from "./activite.type";

export type StructureActiviteRow = {
  id: number;
  date: Date;
  placesEnregistreesDna: number;
  desinsectisation: number | null;
  remiseEnEtat: number | null;
  sousOccupation: number | null;
  placesIndisponibles: number | null;
  tauxOccupation: number | null;
  placesOccupees: number | null;
  placesDisponibles: number | null;
  travaux: number | null;
  placesVacantes: number | null;
  presencesInduesBPI: number | null;
  presencesInduesDeboutees: number | null;
  presencesInduesTotal: number | null;
};

const computePlacesVacantesAndPlacesOccupees = (
  placesAutorisees: number | null | undefined,
  placesIndisponibles: number | null | undefined,
  tauxOccupation: number | null | undefined
): {
  placesDisponibles: number | null;
  placesVacantes: number | null;
  placesOccupees: number | null;
} => {
  if (
    placesAutorisees == null ||
    placesIndisponibles == null ||
    tauxOccupation == null
  ) {
    return {
      placesDisponibles: null,
      placesVacantes: null,
      placesOccupees: null,
    };
  }

  const placesDisponibles = placesAutorisees - placesIndisponibles;
  const placesOccupees = Math.round(placesDisponibles * tauxOccupation);
  const placesVacantes = Math.round(placesDisponibles - placesOccupees);

  return { placesDisponibles, placesVacantes, placesOccupees };
};

const computePresencesInduesTotal = (
  presencesInduesBPI: number | null,
  presencesInduesDeboutees: number | null
): number | null =>
  presencesInduesBPI == null && presencesInduesDeboutees == null
    ? null
    : (presencesInduesBPI ?? 0) + (presencesInduesDeboutees ?? 0);

const averageRounded = (values: (number | null)[]): number | null => {
  const moyenne = average(values);
  return moyenne === null ? null : roundTo(moyenne, 2);
};

export const processActivitesForStructure = (
  activites: Activite[] | null | undefined
): StructureActiviteRow[] => {
  if (!activites?.length) {
    return [];
  }

  const activitesByDate = new Map<number, Activite[]>();
  for (const activite of activites) {
    const dateKey = activite.date.getTime();
    const existing = activitesByDate.get(dateKey);
    if (existing) {
      existing.push(activite);
    } else {
      activitesByDate.set(dateKey, [activite]);
    }
  }

  return [...activitesByDate.entries()]
    .sort(([dateKeyA], [dateKeyB]) => dateKeyB - dateKeyA)
    .map(([, rows]) => {
      const { date, id } = rows[0];

      const placesEnregistreesDna = sumValues(
        rows.map((row) => row.placesAutorisees)
      );
      const desinsectisation = sumValues(
        rows.map((row) => row.desinsectisation)
      );
      const remiseEnEtat = sumValues(rows.map((row) => row.remiseEnEtat));
      const sousOccupation = sumValues(rows.map((row) => row.sousOccupation));
      const travaux = sumValues(rows.map((row) => row.travaux));
      const placesIndisponibles = sumValues(
        rows.map((row) => row.placesIndisponibles)
      );
      const presencesInduesBPI = sumValues(
        rows.map((row) => row.presencesInduesBPI)
      );
      const presencesInduesDeboutees = sumValues(
        rows.map((row) => row.presencesInduesDeboutees)
      );

      const computedPlaces = rows.map((row) =>
        computePlacesVacantesAndPlacesOccupees(
          row.placesAutorisees,
          row.placesIndisponibles,
          decimalToNumber(row.tauxOccupation)
        )
      );

      const placesDisponibles = sumValues(
        computedPlaces.map((computed) => computed.placesDisponibles)
      );
      const placesOccupees = sumValues(
        computedPlaces.map((computed) => computed.placesOccupees)
      );
      const placesVacantes = sumValues(
        computedPlaces.map((computed) => computed.placesVacantes)
      );

      const tauxOccupation = weightedAverage(
        rows.map((row) => ({
          weight: row.placesAutorisees,
          value: decimalToNumber(row.tauxOccupation),
        }))
      );

      if (placesEnregistreesDna == null) {
        return null;
      }

      return {
        id,
        date,
        placesEnregistreesDna,
        desinsectisation,
        remiseEnEtat,
        sousOccupation,
        placesIndisponibles,
        tauxOccupation,
        placesOccupees,
        placesDisponibles,
        travaux,
        placesVacantes,
        presencesInduesBPI,
        presencesInduesDeboutees,
        presencesInduesTotal: computePresencesInduesTotal(
          presencesInduesBPI,
          presencesInduesDeboutees
        ),
      };
    })
    .filter((row): row is StructureActiviteRow => row !== null);
};

export const collectCurrentDnaCodesInDepartement = (
  structures: StructureListLight[],
  departementNumero: string,
  now: Date
): string[] => {
  const dnaCodes = new Set<string>();
  structures.forEach((structure) => {
    const currentVersion = resolveCurrentVersion(
      structure.structureVersions,
      now
    );
    if (currentVersion?.departementAdministratif !== departementNumero) {
      return;
    }
    currentVersion.dnaStructures.forEach((dnaStructure) => {
      if (dnaStructure.dna?.code) {
        dnaCodes.add(dnaStructure.dna.code);
      }
    });
  });
  return [...dnaCodes];
};

export const computeDepartementAverage = (
  activites: Activite[],
  departementNumero: string
): ActiviteStats | null => {
  if (activites.length === 0) {
    return null;
  }

  const rows = activites.map((activite) => {
    const { placesOccupees, placesVacantes } =
      computePlacesVacantesAndPlacesOccupees(
        activite.placesAutorisees,
        activite.placesIndisponibles,
        decimalToNumber(activite.tauxOccupation)
      );
    return {
      placesAutorisees: activite.placesAutorisees,
      placesIndisponibles: activite.placesIndisponibles,
      placesOccupees,
      placesVacantes,
      presencesInduesBPI: activite.presencesInduesBPI,
      presencesInduesDeboutees: activite.presencesInduesDeboutees,
      presencesInduesTotal: computePresencesInduesTotal(
        activite.presencesInduesBPI,
        activite.presencesInduesDeboutees
      ),
    };
  });

  return {
    numero: departementNumero,
    averagePlacesAutorisees: averageRounded(
      rows.map((row) => row.placesAutorisees)
    ),
    averagePlacesIndisponibles: averageRounded(
      rows.map((row) => row.placesIndisponibles)
    ),
    averagePlacesOccupees: averageRounded(
      rows.map((row) => row.placesOccupees)
    ),
    averagePlacesVacantes: averageRounded(
      rows.map((row) => row.placesVacantes)
    ),
    averagePresencesInduesBPI: averageRounded(
      rows.map((row) => row.presencesInduesBPI)
    ),
    averagePresencesInduesDeboutees: averageRounded(
      rows.map((row) => row.presencesInduesDeboutees)
    ),
    averagePresencesIndues: averageRounded(
      rows.map((row) => row.presencesInduesTotal)
    ),
  };
};
