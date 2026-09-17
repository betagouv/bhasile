import MarkdownIt, { type Token } from "markdown-it";
import path from "path";
import { z } from "zod";

import { normalizeWords } from "@/app/utils/string.util";
import { listS3Objects, readS3File, statS3Object } from "@/lib/minio";
import {
  Block,
  FilesBlock,
  FilesTab,
  Link,
  MeasureFile,
  Section,
} from "@/types/ressources.type";

const DOCS_BUCKET_NAME = process.env.DOCS_BUCKET_NAME ?? "";
const SUGGESTIONS_FILE = "_suggestions.md";
const BLOCK_FILE_PATTERN = /^\d+-.+\.md$/;
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const HEADING_TOKEN_COUNT = 3;

const markdown = new MarkdownIt();

const BLOCK_ICONS = [
  "fr-icon-article-line",
  "fr-icon-file-text-line",
  "fr-icon-folder-2-line",
  "fr-icon-question-answer-line",
] as const;

const FrontmatterSchema = z.object({
  type: z.literal("fichiers"),
  titre: z.string().min(1),
  icone: z.enum(BLOCK_ICONS),
});

export const parseBlock = async (
  source: string,
  blockId: string,
  measureFile: MeasureFile
): Promise<FilesBlock> => {
  const { frontmatter, body } = splitFrontmatter(source);
  const meta = FrontmatterSchema.parse(frontmatter);
  const groups = groupByTab(markdown.parse(body, {}));
  const base = { id: blockId, title: meta.titre, icon: meta.icone };

  const tabsArray = await Promise.all(
    groups.map((group) =>
      buildFilesTab(group, blockId, meta.titre, measureFile)
    )
  );

  const tabs = tabsArray.filter((tab) => tab.sections.length > 0);
  checkTabs(tabs, meta.titre);

  return { ...base, type: "fichiers", tabs };
};

export const readBlocks = async (): Promise<Block[]> => {
  const objectKeys = await listS3Objects(DOCS_BUCKET_NAME);

  const matchingKeys = objectKeys
    .filter((objectKey) => BLOCK_FILE_PATTERN.test(path.basename(objectKey)))
    .sort((firstKey, secondKey) =>
      path.basename(firstKey).localeCompare(path.basename(secondKey), "fr", {
        numeric: true,
      })
    );

  const blocks = await Promise.all(
    matchingKeys.map(async (objectKey) => {
      const fileName = path.basename(objectKey);
      const content = await readS3File(objectKey, DOCS_BUCKET_NAME);
      const blockId = slugify(
        fileName.replace(/^\d+-/, "").replace(/\.md$/, "")
      );
      return parseBlock(content, blockId, measureS3File);
    })
  );

  const duplicateId = findDuplicateId(blocks.map((block) => block.id));
  if (duplicateId) {
    throw new Error(
      `Deux fichiers de contenu produisent le même bloc « ${duplicateId} » : leurs noms ne diffèrent que par le préfixe numérique.`
    );
  }

  return blocks;
};

export const readSuggestions = async (): Promise<string[]> => {
  const suggestionsKey = SUGGESTIONS_FILE;
  const content = await readS3File(suggestionsKey, DOCS_BUCKET_NAME);

  return content
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
};

export const measureS3File = async (
  href: string
): Promise<{ extension: string; bytes: number }> => {
  const objectKey = decodeHref(href);

  try {
    const stats = await statS3Object(objectKey, DOCS_BUCKET_NAME);

    return {
      extension: path.extname(objectKey).slice(1).toUpperCase(),
      bytes: stats.size,
    };
  } catch {
    throw new Error(
      `Lien mort : « ${href} » ne correspond à aucun fichier dans le bucket ${DOCS_BUCKET_NAME}.`
    );
  }
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

const buildFilesTab = async (
  group: TabGroup,
  blockId: string,
  blockTitle: string,
  measureFile: MeasureFile
): Promise<FilesTab> => {
  const tabId = `${blockId}--${slugify(group.title)}`;

  const buildSection = async (
    title: string | null,
    tokens: Token[]
  ): Promise<Section> => ({
    id: `${tabId}--${slugify(title ?? "sans-titre")}`,
    title,
    links: await Promise.all(
      extractLinks(tokens).map((link) =>
        buildLink(link, measureFile, [
          blockTitle,
          group.title,
          title ?? "",
          link.label,
        ])
      )
    ),
  });

  const rootSection = await buildSection(null, group.tokens);
  const titledSections = await Promise.all(
    group.subSections.map((subSection) =>
      buildSection(subSection.title, subSection.tokens)
    )
  );
  const sections = [rootSection, ...titledSections].filter(
    (section) => section.links.length > 0
  );

  const duplicateId = findDuplicateId(sections.map((section) => section.id));
  if (duplicateId) {
    throw new Error(
      `Onglet « ${group.title} » : deux sous-titres identiques (« ${duplicateId} »). Renommez l'un des deux ###.`
    );
  }

  for (const section of sections) {
    const duplicateHref = findDuplicateId(
      section.links.map((link) => link.href)
    );
    if (duplicateHref) {
      throw new Error(
        `Onglet « ${group.title} » : le lien « ${duplicateHref} » est listé deux fois dans la même section. Supprimez le doublon.`
      );
    }
  }

  return { id: tabId, title: group.title, sections };
};

const buildLink = async (
  link: { label: string; href: string },
  measureFile: MeasureFile,
  ancestors: string[]
): Promise<Link> => ({
  ...link,
  file: ABSOLUTE_URL_PATTERN.test(link.href)
    ? null
    : await measureFile(link.href),
  searchText: buildSearchText(ancestors),
});

const checkTabs = (tabs: { id: string }[], blockTitle: string): void => {
  if (tabs.length === 0) {
    throw new Error(
      `Bloc « ${blockTitle} » : aucun onglet exploitable. Chaque ## doit contenir au moins un lien.`
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
        currentLink = { label: "", href: String(child.attrGet("href") ?? "") };
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

const buildSearchText = (fragments: string[]): string =>
  normalizeWords(fragments.filter(Boolean).join(" "));

const slugify = (value: string): string =>
  normalizeWords(value).replaceAll(" ", "-");

type TabGroup = {
  title: string;
  tokens: Token[];
  subSections: { title: string; tokens: Token[] }[];
};

type HeadingSplit = {
  before: Token[];
  sections: { title: string; tokens: Token[] }[];
};
