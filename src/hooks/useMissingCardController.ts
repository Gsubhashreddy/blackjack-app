import { useEffect, useRef, useState } from 'react';
import {
  MissingCardController,
  type MissingCardSettings,
  type MissingCardSnapshot,
} from '../domain/missingCardController';

export function useMissingCardController(settings: MissingCardSettings) {
  const controllerRef = useRef<MissingCardController | null>(null);
  const [snapshot, setSnapshot] = useState<MissingCardSnapshot | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new MissingCardController(settings, () => {
      setSnapshot(controllerRef.current!.getSnapshot());
    });
  }

  useEffect(() => {
    const controller = controllerRef.current!;
    controller.start();
    setSnapshot(controller.getSnapshot());
    return () => controller.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { snapshot, controller: controllerRef.current };
}
