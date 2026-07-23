import { ReactElement } from "react";

import Loader from "@/app/components/ui/Loader";

import { Block } from "./Block";
import { BlockTitle } from "./BlockTitle";

export const BlockSkeleton = ({ title, icon }: Props): ReactElement => (
  <Block>
    <BlockTitle title={title} iconClassName={icon} />
    <p className="flex gap-2 items-center text-sm text-mention-grey">
      <Loader />
      Chargement...
    </p>
  </Block>
);

type Props = {
  title: string;
  icon: string;
};
