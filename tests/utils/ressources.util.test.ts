import { describe, expect, it } from "vitest";

import {
  countLinks,
  filterBlocks,
  filterFaqBlock,
  filterFaqItems,
} from "@/app/utils/ressources.util";
import { FaqApiType } from "@/schemas/api/faq.schema";
import { Block, FaqBlock, FilesBlock, FilesTab } from "@/types/ressources.type";

const buildLink = (labelName: string, searchNormalizedText: string) => ({
  label: labelName,
  href: `/${labelName}.odt`,
  file: { extension: "ODT", bytes: 1024 },
  searchText: searchNormalizedText,
});

const FILES_BLOCK: FilesBlock = {
  id: "modeles",
  title: "Modèles",
  icon: "fr-icon-file-text-line",
  type: "fichiers",
  tabs: [
    {
      id: "modeles--actes",
      title: "Actes administratifs",
      sections: [
        {
          id: "modeles--actes--structures-autorisees",
          title: "Structures autorisées",
          links: [
            buildLink(
              "Arrêté d’autorisation",
              "modeles actes administratifs structures autorisees arrete d autorisation"
            ),
          ],
        },
        {
          id: "modeles--actes--toutes-les-structures",
          title: "Toutes les structures",
          links: [
            buildLink(
              "CPOM",
              "modeles actes administratifs toutes les structures cpom"
            ),
          ],
        },
      ],
    },
    {
      id: "modeles--financiers",
      title: "Documents financiers",
      sections: [
        {
          id: "modeles--financiers--sans-titre",
          title: null,
          links: [
            buildLink(
              "Budget prévisionnel",
              "modeles documents financiers budget previsionnel"
            ),
          ],
        },
      ],
    },
  ],
};

const FAQ_BLOCK: FaqBlock = {
  id: "faq",
  title: "FAQ",
  icon: "fr-icon-question-answer-line",
  type: "faq",
  tabs: [
    { id: "1", title: "Général" },
    { id: "2", title: "Finances" },
  ],
};

const FAQ_ITEMS: FaqApiType[] = [
  {
    id: 1,
    question: "Comment effectuer une demande ?",
    contentMarkdown: "Il faut remplir le formulaire A1.",
    category: "Général",
  },
  {
    id: 2,
    question: "Quel est le budget maximum ?",
    contentMarkdown: "Le plafond est fixé à 10 000 euros.",
    category: "Finances",
  },
];

const RESOURCE_BLOCKS: Block[] = [FILES_BLOCK, FAQ_BLOCK];

describe("ressources.util", () => {
  describe("filterBlocks", () => {
    it("renvoie tous les blocs quand la recherche est vide", () => {
      const searchResult = filterBlocks(RESOURCE_BLOCKS, "   ");

      expect(searchResult).toEqual(RESOURCE_BLOCKS);
    });

    it("ne conserve que les liens dont le searchText contient le terme et conserve le bloc FAQ", () => {
      const searchResult = filterBlocks(RESOURCE_BLOCKS, "budget");

      expect(searchResult).toHaveLength(2);
      const filesBlock = searchResult[0] as FilesBlock;
      expect(filesBlock.tabs).toHaveLength(1);
      expect(filesBlock.tabs[0].title).toBe("Documents financiers");
      expect(searchResult[1]).toEqual(FAQ_BLOCK);
    });

    it("conserve tout le contenu d’un onglet quand le terme correspond à son titre", () => {
      const searchResult = filterBlocks(
        RESOURCE_BLOCKS,
        "actes administratifs"
      );

      const filesBlock = searchResult[0] as FilesBlock;
      expect(countLinks(filesBlock.tabs[0])).toBe(2);
    });

    it("ignore les accents et la casse", () => {
      const searchResult = filterBlocks(RESOURCE_BLOCKS, "AUTORISEES");

      const filesBlock = searchResult[0] as FilesBlock;
      expect(filesBlock.tabs[0].sections[0].title).toBe(
        "Structures autorisées"
      );
    });

    it("trouve un contenu quand les mots sont donnés dans le désordre", () => {
      const searchResult = filterBlocks(
        RESOURCE_BLOCKS,
        "administratifs actes"
      );

      const filesBlock = searchResult[0] as FilesBlock;
      expect(countLinks(filesBlock.tabs[0])).toBe(2);
    });

    it("exige que tous les mots de la recherche soient présents", () => {
      const searchResult = filterBlocks(RESOURCE_BLOCKS, "actes budget");

      expect(searchResult).toEqual([FAQ_BLOCK]);
    });

    it("retire les sections, onglets et blocs de fichiers devenus vides", () => {
      const searchResult = filterBlocks(RESOURCE_BLOCKS, "cpom");

      expect(searchResult.map((blockItem) => blockItem.id)).toEqual([
        "modeles",
        "faq",
      ]);
      const filesBlock = searchResult[0] as FilesBlock;
      expect(filesBlock.tabs).toHaveLength(1);
      expect(filesBlock.tabs[0].sections).toHaveLength(1);
      expect(filesBlock.tabs[0].sections[0].title).toBe(
        "Toutes les structures"
      );
    });

    it("renvoie uniquement la FAQ quand aucun fichier ne correspond", () => {
      const searchResult = filterBlocks(RESOURCE_BLOCKS, "introuvable");

      expect(searchResult).toEqual([FAQ_BLOCK]);
    });

    it("ne modifie pas les blocs d’origine", () => {
      const initialBlocksState = JSON.stringify(RESOURCE_BLOCKS);

      filterBlocks(RESOURCE_BLOCKS, "cpom");

      expect(JSON.stringify(RESOURCE_BLOCKS)).toBe(initialBlocksState);
    });

    it("lève une erreur si le type de bloc est inconnu", () => {
      const unknownBlock = {
        id: "inconnu",
        title: "Inconnu",
        type: "unknown-type",
        tabs: [],
      } as unknown as Block;

      expect(() => filterBlocks([unknownBlock], "test")).toThrowError(
        'Type de bloc inconnu : {"id":"inconnu","title":"Inconnu","type":"unknown-type","tabs":[]}'
      );
    });
  });

  describe("filterFaqItems", () => {
    it("renvoie toutes les FAQ quand la recherche est vide", () => {
      const searchResult = filterFaqItems(FAQ_ITEMS, "");

      expect(searchResult).toEqual(FAQ_ITEMS);
    });

    it("filtre les questions FAQ par mot-clé dans le titre ou le contenu", () => {
      const searchResult = filterFaqItems(FAQ_ITEMS, "formulaire");

      expect(searchResult).toHaveLength(1);
      expect(searchResult[0].id).toBe(1);
    });

    it("gère l'insensibilité à la casse et aux accents dans les FAQ", () => {
      const searchResult = filterFaqItems(FAQ_ITEMS, "effectuer demande");

      expect(searchResult).toHaveLength(1);
      expect(searchResult[0].id).toBe(1);
    });

    it("vérifie que tous les mots sont présents à la fois dans le titre et/ou le contenu", () => {
      const searchResult = filterFaqItems(FAQ_ITEMS, "demande A1");

      expect(searchResult).toHaveLength(1);
      expect(searchResult[0].id).toBe(1);
    });

    it("renvoie une liste vide si aucun élément ne correspond", () => {
      const searchResult = filterFaqItems(FAQ_ITEMS, "mot-inexistant");

      expect(searchResult).toHaveLength(0);
    });
  });

  describe("filterFaqBlock", () => {
    it("filtre les onglets du bloc FAQ selon les catégories disponibles dans les items filtrés", () => {
      const filteredItems: FaqApiType[] = [FAQ_ITEMS[1]]; // Catégorie "Finances" uniquement

      const resultFaqBlock = filterFaqBlock(FAQ_BLOCK, filteredItems);

      expect(resultFaqBlock.tabs).toHaveLength(1);
      expect(resultFaqBlock.tabs[0].title).toBe("Finances");
    });

    it("renvoie un tableau d'onglets vide si aucun item ne correspond aux catégories", () => {
      const resultFaqBlock = filterFaqBlock(FAQ_BLOCK, []);

      expect(resultFaqBlock.tabs).toHaveLength(0);
    });
  });

  describe("countLinks", () => {
    it("calcule correctement le nombre total de liens d'un onglet", () => {
      const sampleFilesTab: FilesTab = FILES_BLOCK.tabs[0];

      const totalLinksCount = countLinks(sampleFilesTab);

      expect(totalLinksCount).toBe(2);
    });
  });
});
