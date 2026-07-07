import { ReactElement } from "react";

export const InformationCardBridge = (): ReactElement => {
  return (
    <div className="relative flex flex-col justify-between self-center w-[16px] h-[44px] bg-slate-100">
      <div className="absolute top-0 left-0 right-0 h-[8px] bg-white rounded-b-full" />
      <div className="absolute bottom-0 left-0 right-0 h-[8px] bg-white rounded-t-full" />
    </div>
  );
};
