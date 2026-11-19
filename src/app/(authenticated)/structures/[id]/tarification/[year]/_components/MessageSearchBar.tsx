import Button from "@codegouvfr/react-dsfr/Button";
import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import { ReactElement } from "react";

export const MessageSearchBar = ({
  value,
  onChange,
  isSearching,
  resultCount,
  resultPosition,
  onOlderResult,
  onNewerResult,
}: Props): ReactElement => (
  <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
    <p role="status" className="mb-0 text-sm text-mention-grey">
      {isSearching && getResultLabel(resultCount, resultPosition)}
    </p>
    {resultCount > 0 && (
      <div className="flex">
        <Button
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-arrow-up-s-line"
          title="Résultat plus ancien"
          onClick={onOlderResult}
        />
        <Button
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-arrow-down-s-line"
          title="Résultat plus récent"
          onClick={onNewerResult}
        />
      </div>
    )}
    <SearchBar
      label="Rechercher par mots-clés"
      className="w-96 max-w-full"
      onButtonClick={onOlderResult}
      renderInput={({ className, id, type, placeholder }) => (
        <input
          className={className}
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          // Le SearchBar du DSFR retire le focus sur Entrée : sans ça, un second Entrée n'irait pas au résultat suivant
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.focus();
            }
          }}
        />
      )}
    />
  </div>
);

const getResultLabel = (resultCount: number, resultPosition: number): string =>
  resultCount === 0 ? "Aucun résultat" : `${resultPosition} sur ${resultCount}`;

type Props = {
  value: string;
  onChange: (value: string) => void;
  isSearching: boolean;
  resultCount: number;
  resultPosition: number;
  onOlderResult: () => void;
  onNewerResult: () => void;
};
