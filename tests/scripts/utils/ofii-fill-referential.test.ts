import { buildOperateurLookup } from "scripts/utils/ofii-fill-referential";

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
