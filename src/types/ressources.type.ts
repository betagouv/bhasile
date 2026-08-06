export type Block = FilesBlock | FaqBlock;

export type FilesBlock = BlockBase & {
  type: "fichiers";
  tabs: FilesTab[];
};

export type FaqBlock = BlockBase & {
  type: "faq";
  tabs: FaqTab[];
};

export type FilesTab = {
  id: string;
  title: string;
  sections: Section[];
};

export type FaqTab = {
  id: string;
  title: string;
  questions: Question[];
};

export type Section = {
  title: string | null;
  links: Link[];
};

export type Link = {
  label: string;
  href: string;
  file: FileMetadata | null;
  searchText: string;
};

export type FileMetadata = {
  extension: string;
  bytes: number;
};

export type Question = {
  id: string;
  title: string;
  answerHtml: string;
  searchText: string;
};

export type MeasureFile = (href: string) => FileMetadata;

type BlockBase = {
  id: string;
  title: string;
  icon: string;
};
