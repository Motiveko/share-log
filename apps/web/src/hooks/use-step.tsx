import { useCallback, useMemo, useState } from "react";

export interface Step<T extends string> {
  key: T;
  label: string;
}

export function useStep<T extends string>(steps: Step<T>[]) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const setStep = useCallback((step: T) => {
    const index = steps.findIndex((s) => s.key === step);
    if (index !== -1) {
      setCurrentStepIndex(index);
    }
  }, []);

  const currentStep = useMemo(
    () => steps[currentStepIndex],
    [currentStepIndex]
  );

  return {
    currentStep,
    helpers: { nextStep, previousStep, setStep },
  };
}
