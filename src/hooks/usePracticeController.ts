import { useEffect, useRef, useState } from 'react';
import { PracticeController, type PracticeSnapshot } from '../domain/practiceController';
import type { RunningCountSettings } from '../domain/session';

/** Thin React wrapper around PracticeController: owns its lifecycle and re-renders on change. */
export function usePracticeController(settings: RunningCountSettings) {
  const controllerRef = useRef<PracticeController | null>(null);
  const [snapshot, setSnapshot] = useState<PracticeSnapshot | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new PracticeController(settings, () => {
      setSnapshot(controllerRef.current!.getSnapshot());
    });
  }

  useEffect(() => {
    const controller = controllerRef.current!;
    controller.start();
    setSnapshot(controller.getSnapshot());
    return () => {
      controller.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { snapshot, controller: controllerRef.current };
}
