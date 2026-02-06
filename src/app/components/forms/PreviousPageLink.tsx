import Link from "next/link";

export const PreviousPageLink = ({ previousRoute }: Props) => {
  const content = (
    <>
      <i className="fr-icon-arrow-left-s-line before:w-4 no-underline"></i>
      Étape précédente
    </>
  );

  if (!previousRoute) {
    return (
      <span className="pointer-events-none text-disabled-grey" aria-disabled>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={previousRoute}
      className="fr-link fr-icon border-b w-fit pb-px hover:pb-0 hover:border-b-2 mb-8"
    >
      {content}
    </Link>
  );
};

type Props = {
  previousRoute?: string;
};
