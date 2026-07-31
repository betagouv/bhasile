import { KeyboardEvent, useEffect, useState } from "react";

type CarouselDirection = "next" | "prev";

export const SLIDE_ANIMATION_DURATION_MS = 300;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useCarousel = (length: number) => {
  const [index, setIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<CarouselDirection>("next");

  const goTo = (nextIndex: number, nextDirection: CarouselDirection): void => {
    if (prefersReducedMotion()) {
      setPreviousIndex(null);
      setIndex(nextIndex);
      return;
    }
    setDirection(nextDirection);
    setPreviousIndex(index);
    setIndex(nextIndex);
  };

  useEffect(() => {
    if (previousIndex === null) {
      return;
    }
    const timeoutId = setTimeout(
      () => setPreviousIndex(null),
      SLIDE_ANIMATION_DURATION_MS
    );
    return () => clearTimeout(timeoutId);
  }, [previousIndex]);

  const goToPrevious = (): void => goTo((index - 1 + length) % length, "prev");
  const goToNext = (): void => goTo((index + 1) % length, "next");

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNext();
    }
  };

  const getSlideAnimationClassName = (slideIndex: number): string => {
    if (slideIndex === index) {
      return direction === "next"
        ? "animate-slide-in-right"
        : "animate-slide-in-left";
    }
    if (slideIndex === previousIndex) {
      return direction === "next"
        ? "animate-slide-out-left"
        : "animate-slide-out-right";
    }
    return "invisible";
  };

  return {
    index,
    goToPrevious,
    goToNext,
    handleKeyDown,
    getSlideAnimationClassName,
  };
};
