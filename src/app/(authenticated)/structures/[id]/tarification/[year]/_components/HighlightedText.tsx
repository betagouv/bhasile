import { ReactElement } from "react";

import { splitTextBySearchWords } from "@/utils/message-search.util";

export const HighlightedText = ({ text, searchWords }: Props): ReactElement => (
  <>
    {splitTextBySearchWords(text, searchWords).map((segment, segmentIndex) =>
      segment.isMatch ? (
        <mark key={segmentIndex}>{segment.text}</mark>
      ) : (
        segment.text
      )
    )}
  </>
);

type Props = {
  text: string;
  searchWords: string[];
};
