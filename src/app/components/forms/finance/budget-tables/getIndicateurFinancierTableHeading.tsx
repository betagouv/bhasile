export const getIndicateurFinancierTableHeading = ({
  years,
  cutOffYear,
}: Props) => {
  return [
    <th key="empty"></th>,
    ...years.map((year) => (
      <>
        {year >= cutOffYear && <th>Prévisionnel</th>}
        <th>Réalisé</th>
      </>
    )),
  ];
};

type Props = {
  years: number[];
  cutOffYear: number;
};
