"use client";

import { SegmentedControl } from "@/app/components/common/SegmentedControl";
import { CpomActeScope, CpomActesScope } from "@/app/utils/cpom.util";

export const ActesScopeSwitch = ({
  scopes,
  currentScope,
  handleChange,
}: Props) => {
  return (
    <SegmentedControl
      name="cpomActesScope"
      options={scopes.map(({ scope }) => ({
        id: scope,
        label: scope,
        value: scope,
        isChecked: currentScope === scope,
      }))}
      onChange={(value) => handleChange(value as CpomActeScope)}
    />
  );
};

type Props = {
  scopes: CpomActesScope[];
  currentScope: CpomActeScope;
  handleChange: (scope: CpomActeScope) => void;
};
