import { readdirSync, readFileSync, Stats, statSync } from "fs";
import MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import path from "path";
import { z } from "zod";

import { normalizeAccents, normalizeForSearch } from "@/app/utils/string.util";
import {
  Block,
  FaqTab,
  FilesTab,
  Link,
  MeasureFile,
  Question,
  Section,
} from "@/types/ressources.type";

const CONTENT_DIR = "content/ressources";
const PUBLIC_DIR = "public";
const SUGGESTIONS_FILE = "_suggestions.md";
const BLOCK_FILE_PATTERN = /^\d+-.+\.md$/;
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const HEADING_TOKEN_COUNT = 3;

const markdown = new MarkdownIt();

const FrontmatterSchema = z.object({
  type: z.enum(["fichiers", "faq"]),
  titre: z.string().min(1),
  icone: z.string().min(1),
});

export const parseBlock = (
  source: string,
  blockId: string,
  measureFile: MeasureFile
): Block => {
  const { frontmatter, body } = splitFrontmatter(source);
  const meta = FrontmatterSchema.parse(frontmatter);
  const groups = groupByTab(markdown.parse(body, {}));
  const base = { id: blockId, title: meta.titre, icon: meta.icone };

  if (meta.type === "fichiers") {
    const tabs = groups
      .map((group) => buildFilesTab(group, blockId, meta.titre, measureFile))
      .filter((tab) => tab.sections.length > 0);
    checkTabs(tabs, meta.titre);

    return { ...base, type: "fichiers", tabs };
  }

  if (meta.type === "faq") {
    const tabs = groups
      .map((group) => buildFaqTab(group, blockId, meta.titre))
      .filter((tab) => tab.questions.length > 0);
    checkTabs(tabs, meta.titre);

    return { ...base, type: "faq", tabs };
  }

  const unreachable: never = meta.type;
  throw new Error(`Type de bloc inconnu : ${JSON.stringify(unreachable)}`);
};

export const readBlocks = (): Block[] => {
  const directory = path.join(process.cwd(), CONTENT_DIR);

  const blocks = readdirSync(directory)
    .filter((fileName) => BLOCK_FILE_PATTERN.test(fileName))
    .sort()
    .map((fileName) =>
      parseBlock(
        readFileSync(path.join(directory, fileName), "utf8"),
        slugify(fileName.replace(/^\d+-/, "").replace(/\.md$/, "")),
        measurePublicFile
      )
    );

  const duplicateId = findDuplicateId(blocks.map((block) => block.id));
  if (duplicateId) {
    throw new Error(
      `Deux fichiers de contenu produisent le même bloc « ${duplicateId} » : leurs noms ne diffèrent que par le préfixe numérique.`
    );
  }

  return blocks;
};

export const readSuggestions = (): string[] =>
  readFileSync(path.join(process.cwd(), CONTENT_DIR, SUGGESTIONS_FILE), "utf8")
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());

export const measurePublicFile: MeasureFile = (href) => {
  const publicRoot = path.resolve(process.cwd(), PUBLIC_DIR);
  const absolutePath = path.resolve(publicRoot, decodeHref(href));

  if (
    absolutePath !== publicRoot &&
    !absolutePath.startsWith(publicRoot + path.sep)
  ) {
    throw new Error(
      `Lien invalide : « ${href} » sort du dossier ${PUBLIC_DIR}/, il ne serait pas servi en ligne.`
    );
  }

  const stats = readFileStats(absolutePath, href);

  if (!stats.isFile()) {
    throw new Error(`Lien invalide : « ${href} » ne désigne pas un fichier.`);
  }

  return {
    extension: path.extname(absolutePath).slice(1).toUpperCase(),
    bytes: stats.size,
  };
};

const decodeHref = (href: string): string => {
  try {
    return decodeURIComponent(href).replace(/^\//, "");
  } catch {
    throw new Error(
      `Lien invalide : « ${href} » contient une séquence d'échappement mal formée.`
    );
  }
};

const readFileStats = (absolutePath: string, href: string): Stats => {
  try {
    return statSync(absolutePath);
  } catch {
    throw new Error(
      `Lien mort : « ${href} » ne correspond à aucun fichier dans ${PUBLIC_DIR}/.`
    );
  }
};

const splitFrontmatter = (
  source: string
): { frontmatter: Record<string, string>; body: string } => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    throw new Error(
      "Frontmatter absent : le fichier doit commencer par un bloc --- … --- contenant type, titre et icone."
    );
  }

  const lines = match[1].split("\n").filter((line) => line.trim().length > 0);

  const frontmatter = Object.fromEntries(
    lines.map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        throw new Error(`Ligne de frontmatter invalide : « ${line} »`);
      }
      return [
        line.slice(0, separatorIndex).trim(),
        line.slice(separatorIndex + 1).trim(),
      ];
    })
  );

  return { frontmatter, body: source.slice(match[0].length) };
};

const groupByTab = (tokens: Token[]): TabGroup[] => {
  const { before, sections: tabs } = splitOnHeading(tokens, "h2");

  if (before.length > 0) {
    throw new Error(
      "Contenu placé avant le premier onglet : tout doit être placé sous un titre de niveau 2 (##)."
    );
  }

  return tabs.map((tab) => {
    const { before: rootTokens, sections: subSections } = splitOnHeading(
      tab.tokens,
      "h3"
    );
    return { title: tab.title, tokens: rootTokens, subSections };
  });
};

const splitOnHeading = (tokens: Token[], tag: "h2" | "h3"): HeadingSplit => {
  const before: Token[] = [];
  const sections: HeadingSplit["sections"] = [];
  let target = before;
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];

    if (token.type === "heading_open" && token.tag === tag) {
      const section = {
        title: tokens[index + 1]?.content.trim() ?? "",
        tokens: [],
      };
      sections.push(section);
      target = section.tokens;
      index += HEADING_TOKEN_COUNT;
      continue;
    }

    target.push(token);
    index += 1;
  }

  return { before, sections };
};

const buildFilesTab = (
  group: TabGroup,
  blockId: string,
  blockTitle: string,
  measureFile: MeasureFile
): FilesTab => {
  const buildSection = (title: string | null, tokens: Token[]): Section => ({
    title,
    links: extractLinks(tokens).map((link) =>
      buildLink(link, measureFile, [
        blockTitle,
        group.title,
        title ?? "",
        link.label,
      ])
    ),
  });

  const rootSection = buildSection(null, group.tokens);
  const titledSections = group.subSections.map((subSection) =>
    buildSection(subSection.title, subSection.tokens)
  );

  return {
    id: `${blockId}--${slugify(group.title)}`,
    title: group.title,
    sections: [rootSection, ...titledSections].filter(
      (section) => section.links.length > 0
    ),
  };
};

const buildFaqTab = (
  group: TabGroup,
  blockId: string,
  blockTitle: string
): FaqTab => {
  const tabId = `${blockId}--${slugify(group.title)}`;

  const questions: Question[] = group.subSections.map((subSection) => ({
    id: `${tabId}--${slugify(subSection.title)}`,
    title: subSection.title,
    answerHtml: markdown.renderer.render(
      subSection.tokens,
      markdown.options,
      {}
    ),
    searchText: buildSearchText([
      blockTitle,
      group.title,
      subSection.title,
      extractText(subSection.tokens),
    ]),
  }));

  const duplicateId = findDuplicateId(questions.map((question) => question.id));
  if (duplicateId) {
    throw new Error(
      `Onglet « ${group.title} » : deux questions sont formulées à l'identique (« ${duplicateId} »). Reformulez l'une des deux.`
    );
  }

  return { id: tabId, title: group.title, questions };
};

const buildLink = (
  link: { label: string; href: string },
  measureFile: MeasureFile,
  ancestors: string[]
): Link => ({
  ...link,
  file: ABSOLUTE_URL_PATTERN.test(link.href) ? null : measureFile(link.href),
  searchText: buildSearchText(ancestors),
});

const checkTabs = (tabs: { id: string }[], blockTitle: string): void => {
  if (tabs.length === 0) {
    throw new Error(
      `Bloc « ${blockTitle} » : aucun onglet exploitable. Chaque ## doit contenir au moins un lien ou une question.`
    );
  }

  const duplicateId = findDuplicateId(tabs.map((tab) => tab.id));
  if (duplicateId) {
    throw new Error(
      `Bloc « ${blockTitle} » : deux onglets portent le même titre (« ${duplicateId} »). Renommez l'un des deux ##.`
    );
  }
};

const findDuplicateId = (ids: string[]): string | null => {
  const seenIds = new Set<string>();

  for (const id of ids) {
    if (seenIds.has(id)) {
      return id;
    }
    seenIds.add(id);
  }

  return null;
};

const extractLinks = (tokens: Token[]): { label: string; href: string }[] => {
  const links: { label: string; href: string }[] = [];

  for (const token of tokens) {
    if (token.type !== "inline" || !token.children) {
      continue;
    }

    let currentLink: { label: string; href: string } | null = null;

    for (const child of token.children) {
      if (child.type === "link_open") {
        currentLink = { label: "", href: child.attrGet("href") ?? "" };
      } else if (child.type === "link_close" && currentLink) {
        links.push({ ...currentLink, label: currentLink.label.trim() });
        currentLink = null;
      } else if (currentLink && child.content) {
        currentLink.label += child.content;
      }
    }
  }

  return links;
};

const extractText = (tokens: Token[]): string =>
  tokens
    .filter((token) => token.type === "inline")
    .map((token) =>
      (token.children ?? [])
        .filter(
          (child) => child.type === "text" || child.type === "code_inline"
        )
        .map((child) => child.content)
        .join(" ")
    )
    .join(" ");

const buildSearchText = (fragments: string[]): string =>
  normalizeForSearch(fragments.filter(Boolean).join(" "));

const slugify = (value: string): string =>
  normalizeAccents(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type TabGroup = {
  title: string;
  tokens: Token[];
  subSections: { title: string; tokens: Token[] }[];
};

type HeadingSplit = {
  before: Token[];
  sections: { title: string; tokens: Token[] }[];
};
