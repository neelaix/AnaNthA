import { useEffect } from 'react';
import { registerShortcut, KeyboardShortcut } from '../utils/a11y';

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]): void => {
  useEffect(() => {
    const cleanups = shortcuts.map(registerShortcut);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [shortcuts]);
};
