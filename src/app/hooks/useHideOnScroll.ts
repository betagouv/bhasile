import { useEffect, useState } from "react";

export const useHideOnScroll = (threshold = 80) => {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;

        if (currentY <= threshold) {
          setIsHidden(false);
        } else if (delta > 4) {
          setIsHidden(true);
        } else if (delta < -4) {
          setIsHidden(false);
        }

        lastY = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { isHidden };
};
