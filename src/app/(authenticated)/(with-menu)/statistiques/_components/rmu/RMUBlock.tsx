import { RMUChart } from "./RMUChart";
import { RMUStatsTable } from "./RMUStatsTable";

export const RMUBlock = () => {
  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className="text-title-blue-france mr-3 fr-icon-article-line" />
          <h3 className="text-title-blue-france fr-h6 mb-12">
            Référés Mesures Utiles
          </h3>
        </div>
      </div>
      <div className="pb-16">
        <RMUChart />
      </div>
      <RMUStatsTable />
    </div>
  );
};
