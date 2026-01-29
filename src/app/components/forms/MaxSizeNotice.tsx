import { Notice } from "@codegouvfr/react-dsfr/Notice";

export const MaxSizeNotice = () => {
  return (
    <Notice
      severity="info"
      title=""
      className="rounded [&_p]:flex [&_p]:items-center mb-8 w-fit [&_.fr-notice\_\_desc]:text-text-default-grey"
      description={
        <>
          Taille maximale par fichier : 10 Mo. Formats supportés : pdf, xls,
          xlsx, xlsm, csv et ods.{" "}
          <a
            target="_blank"
            className="underline"
            rel="noopener noreferrer"
            href="https://stirling-pdf.framalab.org/compress-pdf?lang=fr_FR"
          >
            Votre fichier est trop lourd ? Compressez-le
          </a>
        </>
      }
    />
  );
};
