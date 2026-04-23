export type GrammaticalGender = "m" | "f";

export type ListEntity = {
  singular: string;
  plural: string;
  gender: GrammaticalGender;
};

export const LIST_ENTITIES = {
  operateur: { singular: "opérateur", plural: "opérateurs", gender: "m" },
  structure: { singular: "structure", plural: "structures", gender: "f" },
  cpom: { singular: "CPOM", plural: "CPOM", gender: "m" },
} as const satisfies Record<string, ListEntity>;

export type ListEntityKey = keyof typeof LIST_ENTITIES;

export function formatEmptyList(entity: ListEntity): string {
  const aucun = entity.gender === "f" ? "Aucune" : "Aucun";
  const trouve = entity.gender === "f" ? "trouvée" : "trouvé";
  return `${aucun} ${entity.singular} ${trouve}`;
}
