import { useCallback, useEffect, useMemo, useState } from "react";

interface UseStepPlayerOptions {
  autoPlayIntervalMs?: number;
}

export function useStepPlayer<T>(
  steps: T[],
  options: UseStepPlayerOptions = {}
) {
  const { autoPlayIntervalMs = 1200 } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalSteps = steps.length;

  useEffect(() => {
    if (totalSteps === 0) {
      setCurrentIndex(0);
      setIsPlaying(false);
      return;
    }

    setCurrentIndex((prev) => Math.min(prev, totalSteps - 1));
  }, [totalSteps]);

  const next = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, Math.max(totalSteps - 1, 0)));
  }, [totalSteps]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (totalSteps === 0) return;
      const safeIndex = Math.max(0, Math.min(index, totalSteps - 1));
      setCurrentIndex(safeIndex);
    },
    [totalSteps]
  );

  const play = useCallback(() => {
    if (totalSteps <= 1) return;
    setIsPlaying(true);
  }, [totalSteps]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isPlaying || totalSteps <= 1) return;

    const timerId = window.setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= totalSteps - 1) {
          window.clearInterval(timerId);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, autoPlayIntervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isPlaying, totalSteps, autoPlayIntervalMs]);

  const currentStep = useMemo(() => {
    if (totalSteps === 0) return null;
    return steps[currentIndex] ?? null;
  }, [steps, currentIndex, totalSteps]);

  return {
    steps,
    totalSteps,
    currentIndex,
    currentStep,
    isPlaying,
    canPrev: currentIndex > 0,
    canNext: currentIndex < totalSteps - 1,
    next,
    prev,
    reset,
    goTo,
    play,
    pause,
    togglePlay,
  };
}