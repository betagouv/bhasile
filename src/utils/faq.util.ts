import MarkdownIt from "markdown-it";

const markdownParser = new MarkdownIt({ html: false });

export const renderFaqMarkdown = (markdown: string): string =>
  markdownParser.render(markdown);
