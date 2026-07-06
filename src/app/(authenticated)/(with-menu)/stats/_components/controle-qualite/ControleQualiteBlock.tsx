import { WorkInProgress } from "@/app/components/WorkInProgress";

export const ControleQualiteBlock = () => {
  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className="text-title-blue-france mr-3 fr-icon-search-line" />
          <h3 className="text-title-blue-france fr-h6 mb-12">
            Contrôle qualité
          </h3>
        </div>
      </div>
      <WorkInProgress />
    </div>
  );
};
