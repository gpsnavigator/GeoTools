import { RefObject, useEffect } from 'react';

/**
 * The close behaviour shared by every dropdown and popover: calls `onDismiss` when the user presses Escape or
 * presses the mouse / touches the screen anywhere outside `ref`. Only listens while `active`.
 */
export function useDismissable(ref: RefObject<HTMLElement | null>, active: boolean, onDismiss: () => void): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, active, onDismiss]);
}
