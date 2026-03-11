import { CustomNotice } from "../common/CustomNotice";

export const ContractualisationHuda = () => {
  return (
    <CustomNotice
      severity="info"
      title=""
      className="rounded [&_p]:flex [&_p]:items-center mb-4 w-fit"
      description="Dans le cas des structures HUDA, nous vous recommandons de renouveler les conventions sur un an seulement pour anticiper la transformation prochaine de ces structures en CADA."
    />
  );
};
