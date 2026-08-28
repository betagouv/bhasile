import { Table } from "@codegouvfr/react-dsfr/Table";
import { ReactElement } from "react";

import { EmptyCell } from "@/app/components/common/EmptyCell";
import { SeeFileButton } from "@/app/components/common/SeeFileButton";
import { formatDate } from "@/app/utils/date.util";
import { EVALUATION_NOTES_START_YEAR } from "@/constants";
import { EvaluationApiType } from "@/schemas/api/evaluation.schema";

export const EvaluationTable = ({ evaluations }: Props): ReactElement => {
  const getEvaluations = () => {
    return evaluations.map((evaluation) => [
      <span className="inline-block text-center w-full" key={evaluation.id}>
        {formatDate(evaluation.date)}
      </span>,
      <span className="inline-block text-center w-full" key={evaluation.id}>
        {evaluation.notePersonne ?? <EmptyCell />}
      </span>,
      <span className="inline-block text-center w-full" key={evaluation.id}>
        {evaluation.notePro ?? <EmptyCell />}
      </span>,
      <span className="inline-block text-center w-full" key={evaluation.id}>
        {evaluation.noteStructure ?? <EmptyCell />}
      </span>,
      <span className="inline-block text-center w-full" key={evaluation.id}>
        {evaluation.note ?? <EmptyCell />}
      </span>,
      <span className="inline-block text-center w-full" key={evaluation.id}>
        <SeeFileButton
          key={evaluation.id}
          fileUploadKey={evaluation.fileUploads?.[0]?.key ?? ""}
        />
      </span>,
      <span className="inline-block text-center w-20" key={evaluation.id}>
        {evaluation.fileUploads?.[1]?.key ? (
          <SeeFileButton
            key={`plan-${evaluation.id}`}
            fileUploadKey={evaluation.fileUploads?.[1]?.key ?? ""}
          />
        ) : (
          <EmptyCell />
        )}
      </span>,
    ]);
  };

  return (
    <div className="evaluation-table-container">
      <Table
        bordered={true}
        className="full-width-table"
        caption=""
        data={getEvaluations()}
        headers={[
          "DATE",
          "LA PERSONNE",
          "LES PROFESSIONNELS",
          "LA STRUCTURE",
          "MOYENNE",
          "RAPPORT",
          "PLAN D’ACTION",
        ]}
      />
      <span className="italic block border-t border-default-grey text-mention-grey py-2 px-4 text-xs">
        Seules les évaluations menées à partir de {EVALUATION_NOTES_START_YEAR}{" "}
        prennent en compte des notes et un plan d’action optionnel.
      </span>
      <style>{`
        @media print {
          .evaluation-table-container th:nth-last-child(-n+2),
          .evaluation-table-container td:nth-last-child(-n+2) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

type Props = {
  evaluations: EvaluationApiType[];
};
