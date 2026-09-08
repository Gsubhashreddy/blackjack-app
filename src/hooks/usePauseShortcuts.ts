import { useEffect } from 'react';

const CONTROL_SELECTOR =
  'button, a, input, select, textarea, label, [role="button"], [role="dialog"], [role="alertdialog"], [contenteditable]:not([contenteditable="false"])';

export function usePauseShortcuts(controller: { pause(): void } | null, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !controller) return;

    const isControl = (target: EventTarget | null) =>
      target instanceof Element && target.closest(CONTROL_SELECTOR) !== null;

    const handleClick = (event: MouseEvent) => {
      if (!event.defaultPrevented && event.button === 0 && !isControl(event.target)) {
        controller.pause();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isControl(event.target)
      ) {
        return;
      }

      event.preventDefault();
      if (!event.repeat) controller.pause();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [controller, enabled]);
}
