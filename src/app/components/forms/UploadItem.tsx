import { PropsWithChildren, ReactElement, ReactNode } from "react";

export const UploadItem = ({
  children,
  title,
  titleId,
  subTitle,
}: UploadItemProps): ReactElement => {
  return (
    <div className="flex flex-col h-full">
      <div className="pb-2">
        <p
          id={titleId}
          className="text-title-blue-france text-sm font-bold mb-0"
        >
          {title}
        </p>
        {subTitle && (
          <p className="text-mention-grey text-xs font-normal mb-0">
            {subTitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
};

type UploadItemProps = PropsWithChildren & {
  title: ReactNode;
  titleId: string;
  subTitle?: string;
};
