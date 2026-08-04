import { readFile } from "node:fs/promises";

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { useSpreadsheetParse } from "@/app/hooks/useSpreadsheetParse";
import { Repartition } from "@/types/adresse.type";

describe("useSpreadsheetParse", () => {
  it("importe les adresses d'un tableur diffus et force la répartition à DIFFUS", async () => {
    const file = buildSpreadsheetFile(HEADERS_DIFFUS, [
      ["1 rue de la Paix", "35000", "Rennes", 12, "Oui", "Non"],
      ["2 avenue Foch", "75008", "Paris", 4, "non", "OUI"],
    ]);

    const { result } = renderHook(() => useSpreadsheetParse());
    const adresses = await result.current.parseAdressesDiffuses(file);

    expect(adresses).toEqual([
      {
        adresse: "1 rue de la Paix",
        codePostal: "35000",
        commune: "Rennes",
        adresseComplete: "1 rue de la Paix 35000 Rennes",
        departement: "35",
        repartition: Repartition.DIFFUS,
        placesAutorisees: 12,
        isQpv: false,
        isLogementSocial: true,
      },
      {
        adresse: "2 avenue Foch",
        codePostal: "75008",
        commune: "Paris",
        adresseComplete: "2 avenue Foch 75008 Paris",
        departement: "75",
        repartition: Repartition.DIFFUS,
        placesAutorisees: 4,
        isQpv: true,
        isLogementSocial: false,
      },
    ]);
  });

  it("conserve le type de bâti d'un tableur mixte", async () => {
    const file = buildSpreadsheetFile(HEADERS_MIXTE, [
      ["1 rue de la Paix", "35000", "Rennes", 12, "Oui", "Non", "COLLECTIF"],
      ["2 avenue Foch", "75008", "Paris", 4, "Non", "Oui", "DIFFUS"],
    ]);

    const { result } = renderHook(() => useSpreadsheetParse());
    const adresses = await result.current.parseAdressesMixtes(file);

    expect(adresses.map((adresse) => adresse.repartition)).toEqual([
      Repartition.COLLECTIF,
      Repartition.DIFFUS,
    ]);
  });

  it("force la répartition à DIFFUS même si le tableur porte une colonne Type de bâti", async () => {
    const file = buildSpreadsheetFile(HEADERS_MIXTE, [
      ["1 rue de la Paix", "35000", "Rennes", 12, "Oui", "Non", "COLLECTIF"],
    ]);

    const { result } = renderHook(() => useSpreadsheetParse());
    const adresses = await result.current.parseAdressesDiffuses(file);

    expect(adresses.map((adresse) => adresse.repartition)).toEqual([
      Repartition.DIFFUS,
    ]);
  });

  it("ignore les lignes vides intercalées entre deux adresses", async () => {
    const file = buildSpreadsheetFile(HEADERS_DIFFUS, [
      ["1 rue de la Paix", "35000", "Rennes", 12, "Oui", "Non"],
      [null, null, null, null, null, null],
      ["2 avenue Foch", "75008", "Paris", 4, "Non", "Oui"],
    ]);

    const { result } = renderHook(() => useSpreadsheetParse());
    const adresses = await result.current.parseAdressesDiffuses(file);

    expect(adresses.map((adresse) => adresse.adresse)).toEqual([
      "1 rue de la Paix",
      "2 avenue Foch",
    ]);
  });

  it("signale le numéro de ligne du tableur quand une cellule est invalide", async () => {
    const file = buildSpreadsheetFile(HEADERS_DIFFUS, [
      ["1 rue de la Paix", "35000", "Rennes", 12, "Oui", "Non"],
      [null, null, null, null, null, null],
      ["2 avenue Foch", "75008", "Paris", "pas un nombre", "Non", "Oui"],
    ]);

    const { result } = renderHook(() => useSpreadsheetParse());

    await expect(
      result.current.parseAdressesDiffuses(file)
    ).rejects.toThrowError("Valeur invalide (Places autorisées : ligne 5)");
  });

  it("rejette un tableur ne contenant aucune adresse plutôt que de vider la liste", async () => {
    const file = buildSpreadsheetFile(HEADERS_DIFFUS, []);

    const { result } = renderHook(() => useSpreadsheetParse());

    await expect(
      result.current.parseAdressesDiffuses(file)
    ).rejects.toThrowError("Aucune adresse n'a été trouvée dans le tableur");
  });

  it("rejette le modèle de tableur distribué tant qu'il n'a pas été rempli", async () => {
    const contents = await readFile("public/adresses-diffus.xlsx");
    const file = new File([new Uint8Array(contents)], "adresses-diffus.xlsx");

    const { result } = renderHook(() => useSpreadsheetParse());

    await expect(
      result.current.parseAdressesDiffuses(file)
    ).rejects.toThrowError("Valeur invalide (Code postal : ligne 3)");
  });
});

const HEADERS_DIFFUS = [
  "Adresse",
  "Code postal",
  "Ville",
  "Places autorisées",
  "Logement social",
  "QPV",
];

const HEADERS_MIXTE = [...HEADERS_DIFFUS, "Type de bâti"];

const EXAMPLE_ROW = [
  "Ex : '123 rue de l’Europe'",
  "Ex : '35000'",
  "Ex : 'Rennes'",
  "Renseignez le nombre de places autorisées théorique. Ex : '52'",
  "Précisez pour chaque adresse 'Oui' ou 'Non'",
  "Précisez pour chaque adresse 'Oui' ou 'Non'",
  "Renseignez \"Collectif\" ou \"Diffus\"",
];

const buildSpreadsheetFile = (
  headers: string[],
  dataRows: (string | number | null)[][]
): File => {
  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    EXAMPLE_ROW.slice(0, headers.length),
    ...dataRows,
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Feuille1");
  const contents = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

  return new File([contents], "adresses.xlsx");
};
