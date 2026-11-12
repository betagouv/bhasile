import {
  createOfiiReferential,
  createOfiiRow,
} from "tests/test-utils/factories/ofii.factory";

import {
  buildOperateurLookup,
  describeOfiiChanges,
  validateOfiiRows,
} from "@/app/api/ofii-imports/ofii-import.util";

describe("buildOperateurLookup", () => {
  it("rapproche un opérateur de son nom en base", () => {
    // GIVEN
    const operateurs = [{ id: 1, name: "FRANCE TERRE D'ASILE", ofiiNames: [] }];

    // WHEN
    const lookup = buildOperateurLookup(operateurs);

    // THEN
    expect(lookup.get("FRANCE TERRE D'ASILE")).toEqual({
      id: 1,
      name: "FRANCE TERRE D'ASILE",
    });
  });

  it("rapproche un opérateur de chacun de ses libellés OFII", () => {
    // GIVEN
    const operateurs = [
      {
        id: 1,
        name: "FRANCE TERRE D'ASILE",
        ofiiNames: ["FRANCE TERRE D ASILE", " ftda "],
      },
    ];

    // WHEN
    const lookup = buildOperateurLookup(operateurs);

    // THEN
    expect(lookup.get("FRANCE TERRE D ASILE")?.name).toBe(
      "FRANCE TERRE D'ASILE"
    );
    expect(lookup.get("FTDA")?.name).toBe("FRANCE TERRE D'ASILE");
  });

  it("privilégie le libellé OFII sur le nom d'un opérateur doublon", () => {
    // GIVEN
    const operateurs = [
      { id: 1, name: "COALLIA HABITAT", ofiiNames: [] },
      { id: 2, name: "COALLIA", ofiiNames: ["COALLIA HABITAT"] },
    ];

    // WHEN
    const lookup = buildOperateurLookup(operateurs);

    // THEN
    expect(lookup.get("COALLIA HABITAT")).toEqual({ id: 2, name: "COALLIA" });
  });

  it("rejette un libellé OFII rattaché à deux opérateurs", () => {
    // GIVEN
    const operateurs = [
      { id: 1, name: "ADOMA", ofiiNames: ["COALLIA HABITAT"] },
      { id: 2, name: "COALLIA", ofiiNames: ["COALLIA HABITAT"] },
    ];

    // WHEN / THEN
    expect(() => buildOperateurLookup(operateurs)).toThrow(
      /COALLIA HABITAT.*ADOMA.*COALLIA/
    );
  });
});

describe("validateOfiiRows", () => {
  it("prépare le DNA d'une ligne valide, avec un nom nettoyé", () => {
    const { dnas, errors } = validateOfiiRows(
      [createOfiiRow()],
      createOfiiReferential()
    );

    expect(errors).toEqual([]);
    expect(dnas).toEqual([
      {
        code: "C0301",
        departementAdministratif: "03",
        directionTerritoriale: "Clermont-Ferrand",
        nom: "CADA MOULINS ADOMA - 03",
        nomOfii: "CADA MOULINS ADOMA",
        operateurId: 7,
        type: "CADA",
      },
    ]);
  });

  it("liste toutes les anomalies d'une ligne invalide sans préparer de DNA", () => {
    const { dnas, errors } = validateOfiiRows(
      [
        createOfiiRow({
          departement: "Atlantide",
          type: "HOTEL",
          operateur: "INCONNU",
        }),
      ],
      createOfiiReferential()
    );

    expect(dnas).toEqual([]);
    expect(errors).toEqual([
      {
        key: "C0301",
        issues: [
          "département « Atlantide » inconnu",
          "type de structure « HOTEL » inconnu",
          "opérateur « INCONNU » inconnu de Bhasile",
        ],
      },
    ]);
  });
});

describe("describeOfiiChanges", () => {
  it("décrit les créations, mises à jour, réactivations et désactivations", () => {
    expect(
      describeOfiiChanges({
        codes: ["C0301", "C0302", "C0303"],
        existingDnas: [
          { code: "C0302", inactiveInOfiiFileSince: null },
          { code: "C0303", inactiveInOfiiFileSince: new Date("2025-01-31") },
        ],
        deactivatedCount: 12,
      })
    ).toEqual([
      "1 nouvelle structure",
      "1 structure mise à jour",
      "1 structure réactivée",
      "12 structures absentes du fichier passées inactives",
    ]);
  });
});
