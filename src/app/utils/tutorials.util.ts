export const getFinanceFormTutorialLink = ({
  isAutorisee,
  isSubventionnee,
  isOrWasInCpom,
}: Props): string => {
  if (isAutorisee && isOrWasInCpom) {
    return "https://www.loom.com/share/e10b99446da747f9881c84e8c80cae4e";
  }
  if (isAutorisee && !isOrWasInCpom) {
    return "https://www.loom.com/share/32683d9948084be9a24351a6b712f8d0";
  }
  if (isSubventionnee && isOrWasInCpom) {
    return "https://www.loom.com/share/dcf47a9164304db0a972a75cd5cf23f1";
  }
  if (isSubventionnee && !isOrWasInCpom) {
    return "https://www.loom.com/share/c7f7b6b974f44d728790d9486b663010";
  }
  return "";
};

type Props = {
  isAutorisee: boolean;
  isSubventionnee: boolean;
  isOrWasInCpom: boolean;
};
