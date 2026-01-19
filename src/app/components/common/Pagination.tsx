import { useRouter, useSearchParams } from "next/navigation";
import { ReactElement, useCallback } from "react";

import { DEFAULT_PAGE_SIZE } from "@/constants";

export const Pagination = ({ totalElements }: Props): ReactElement | null => {
  const router = useRouter();

  const searchParams = useSearchParams();
  const currentPage: number = Number(searchParams.get("page")) || 0;

  const setCurrentPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("page", String(page));
      router.replace(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  const totalPages = Math.ceil(totalElements / DEFAULT_PAGE_SIZE);

  return (
    <nav role="navigation" className="fr-pagination" aria-label="Pagination">
      <ul className="fr-pagination__list">
        <li>
          <a
            className="fr-pagination__link fr-pagination__link--first"
            href={currentPage === 0 ? undefined : ""}
            aria-disabled={currentPage === 0}
            role="link"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(0);
            }}
          >
            Première page
          </a>
        </li>
        <li>
          <a
            className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
            href={currentPage - 1 < 0 ? undefined : ""}
            aria-disabled={currentPage - 1 >= 0}
            role="link"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage - 1 >= 0) {
                setCurrentPage(currentPage - 1);
              }
            }}
          >
            Page précédente
          </a>
        </li>
        <li>
          <a
            className="fr-pagination__link"
            role="link"
            href="#"
            title={`Page ${currentPage + 1}/${totalPages}`}
          >
            Page {currentPage + 1}/{totalPages}
          </a>
        </li>
        <li>
          <a
            className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
            role="link"
            href={currentPage + 1 >= totalPages ? undefined : ""}
            aria-disabled={currentPage + 1 < totalPages}
            onClick={(e) => {
              e.preventDefault();
              if (currentPage + 1 < totalPages) {
                setCurrentPage(currentPage + 1);
              }
            }}
          >
            Page suivante
          </a>
        </li>
        <li>
          <a
            className="fr-pagination__link fr-pagination__link--last"
            role="link"
            href={currentPage + 1 >= totalPages ? undefined : ""}
            aria-disabled={currentPage + 1 < totalPages}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(totalPages - 1);
            }}
          >
            Dernière page
          </a>
        </li>
      </ul>
    </nav>
  );
};

type Props = {
  totalElements: number;
};
