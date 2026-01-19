import { ReactElement } from "react";

import { SHORT_PAGE_SIZE } from "@/constants";

export const SimplePagination = ({
  totalElements,
  currentPage,
  setCurrentPage,
  pageSize = SHORT_PAGE_SIZE,
}: Props): ReactElement | null => {
  const totalPages = Math.ceil(totalElements / pageSize);

  return (
    <nav role="navigation" className="fr-pagination" aria-label="Pagination">
      <ul className="fr-pagination__list">
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
            Précédent
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
            Suivant
          </a>
        </li>
      </ul>
    </nav>
  );
};

type Props = {
  totalElements: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize?: number;
};
