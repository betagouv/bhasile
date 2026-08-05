import { useEffect } from "react";

import { useOptionalTransformationContext } from "@/contexts/TransformationClientContext";

export const TransformationFakeSaver = () => {
  const { registerSaver } = useOptionalTransformationContext();

  useEffect(() => {
    registerSaver(async () => true);
    return () => registerSaver(null);
  }, [registerSaver]);

  return null;
};
