import { describe, expect, it } from "vitest";

import { MessageApiRead } from "@/schemas/api/message.schema";
import {
  findSearchResultIds,
  parseSearchWords,
  splitTextBySearchWords,
} from "@/utils/message-search.util";

const buildMessage = (
  id: number,
  text: string,
  attachmentNames: string[] = []
): MessageApiRead => ({
  id,
  text,
  tagKey: null,
  authorLevel: "DEPARTEMENT",
  createdAt: "2026-10-27T10:00:00.000Z",
  author: { id: 2, name: "Paul Martin" },
  receipts: [],
  attachments: attachmentNames.map((originalName, attachmentIndex) => ({
    id: attachmentIndex,
    key: `cle-${attachmentIndex}`,
    originalName,
    mimeType: "application/pdf",
    fileSize: 1024,
  })),
});

const getHighlights = (text: string, searchQuery: string): string[] =>
  splitTextBySearchWords(text, parseSearchWords(searchQuery))
    .filter(({ isMatch }) => isMatch)
    .map((segment) => segment.text);

describe("parseSearchWords", () => {
  it("normalise chaque mot et ignore les espaces en trop", () => {
    expect(parseSearchWords("  Excédent   TABLEAU ")).toEqual([
      "excedent",
      "tableau",
    ]);
  });

  it("ne garde aucun mot quand il n'y a que de la ponctuation ignorée", () => {
    expect(parseSearchWords(" - _ ")).toEqual([]);
  });
});

describe("findSearchResultIds", () => {
  const search = (messages: MessageApiRead[], searchQuery: string) =>
    findSearchResultIds(messages, parseSearchWords(searchQuery));

  it("renvoie les messages trouvés du plus récent au plus ancien", () => {
    const messages = [
      buildMessage(1, "excédent"),
      buildMessage(2, "autre"),
      buildMessage(3, "excedent"),
    ];

    expect(search(messages, "excedent")).toEqual([3, 1]);
  });

  it("exige tous les mots, dans n'importe quel ordre", () => {
    const messages = [buildMessage(1, "tableau de l'excédent")];

    expect(search(messages, "excedent tableau")).toEqual([1]);
    expect(search(messages, "excedent chauffage")).toEqual([]);
  });

  it("répartit les mots entre le texte et les pièces jointes", () => {
    const messages = [buildMessage(1, "Voici la facture", ["Chauffage.pdf"])];

    expect(search(messages, "facture chauffage")).toEqual([1]);
  });

  it("ne cherche pas dans le nom de l'auteur", () => {
    expect(search([buildMessage(1, "Bonjour")], "martin")).toEqual([]);
  });

  it("ne renvoie rien sans mot à chercher", () => {
    expect(search([buildMessage(1, "Bonjour")], "   ")).toEqual([]);
  });
});

describe("splitTextBySearchWords", () => {
  it("garde le texte d'origine quand on recherche sans accent ni casse", () => {
    expect(splitTextBySearchWords("L'Excédent validé", ["excedent"])).toEqual([
      { text: "L'", isMatch: false },
      { text: "Excédent", isMatch: true },
      { text: " validé", isMatch: false },
    ]);
  });

  it("garde des positions justes après une ligature qui allonge le texte", () => {
    expect(getHighlights("Une œuvre et un tableau", "tableau")).toEqual([
      "tableau",
    ]);
  });

  it("surligne la ligature entière quand un mot n'en couvre qu'une partie", () => {
    expect(getHighlights("cœur", "co")).toEqual(["cœ"]);
  });

  it("garde les accents décomposés dans le surlignage", () => {
    expect(getHighlights("résumé final", "resume")).toEqual(["résumé"]);
  });

  it("trouve un mot écrit avec un tiret, une apostrophe ou plusieurs espaces", () => {
    expect(getHighlights("le sous-sol", "sous-sol")).toEqual(["sous-sol"]);
    expect(getHighlights("l'excédent", "l'excedent")).toEqual(["l'excédent"]);
    expect(getHighlights("sous   sol", "sous-sol")).toEqual(["sous   sol"]);
  });

  it("confond l'apostrophe droite et l'apostrophe typographique", () => {
    expect(getHighlights("aujourd’hui", "aujourd'hui")).toEqual([
      "aujourd’hui",
    ]);
    expect(getHighlights("aujourd'hui", "aujourd’hui")).toEqual([
      "aujourd'hui",
    ]);
  });

  it("surligne toutes les occurrences", () => {
    expect(getHighlights("Tarif et tarifs", "tarif")).toEqual([
      "Tarif",
      "tarif",
    ]);
  });

  it("fusionne les mots qui se chevauchent", () => {
    expect(getHighlights("tableau", "table bleau")).toEqual(["tableau"]);
  });

  it("renvoie le texte seul sans mot à chercher", () => {
    expect(splitTextBySearchWords("Bonjour", [])).toEqual([
      { text: "Bonjour", isMatch: false },
    ]);
  });

  it("ne renvoie rien pour un texte vide", () => {
    expect(splitTextBySearchWords("", ["tarif"])).toEqual([]);
  });
});
