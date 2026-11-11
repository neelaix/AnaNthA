/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

/**
 * Generate unique ID for ARIA attributes
 */
export const generateId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Announce message to screen readers
 */
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;

  document.body.appendChild(announcer);
  setTimeout(() => {
    announcer.remove();
  }, 1000);
};

/**
 * Focus trap for modals
 */
export const createFocusTrap = (element: HTMLElement): (() => void) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;

  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Keyboard shortcut handler
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: () => void;
}

export const registerShortcut = (shortcut: KeyboardShortcut): (() => void) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const match =
      e.key.toLowerCase() === shortcut.key.toLowerCase() &&
      (shortcut.ctrl === undefined || e.ctrlKey === shortcut.ctrl) &&
      (shortcut.shift === undefined || e.shiftKey === shortcut.shift) &&
      (shortcut.alt === undefined || e.altKey === shortcut.alt) &&
      (shortcut.meta === undefined || e.metaKey === shortcut.meta);

    if (match) {
      e.preventDefault();
      shortcut.callback();
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Get keyboard shortcut description
 */
export const getShortcutDescription = (shortcut: KeyboardShortcut): string => {
  const keys: string[] = [];

  if (shortcut.meta) keys.push('Cmd');
  else if (shortcut.ctrl) keys.push('Ctrl');

  if (shortcut.alt) keys.push('Alt');
  if (shortcut.shift) keys.push('Shift');

  keys.push(shortcut.key.toUpperCase());
  return keys.join(' + ');
};

/**
 * Skip to main content link - returns HTML string (use in component)
 */
export const getSkipToContentHTML = (): string => {
  return `
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-lavender-600 focus:text-white focus:rounded-lg"
    >
      Skip to main content
    </a>
  `;
};

/**
 * Check if element is in viewport
 */
export const isInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Scroll element into view if not visible
 */
export const scrollIntoViewIfNeeded = (element: HTMLElement): void => {
  if (!isInViewport(element)) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

/**
 * Heading hierarchy validator
 */
export const validateHeadingHierarchy = (): { valid: boolean; issues: string[] } => {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const issues: string[] = [];
  let lastLevel = 0;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName[1]);

    if (index === 0 && level !== 1) {
      issues.push('Page should start with H1');
    }

    if (level > lastLevel + 1) {
      issues.push(`Heading hierarchy skipped from H${lastLevel} to H${level}`);
    }

    lastLevel = level;
  });

  return {
    valid: issues.length === 0,
    issues,
  };
};

/**
 * Color contrast checker (simplified)
 */
export const getContrastRatio = (rgb1: string, rgb2: string): number => {
  const getLuminance = (rgb: string): number => {
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return 0;

    const [r, g, b] = match.map((x) => {
      const v = parseInt(x) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast ratio meets WCAG AA standard (4.5:1 for normal text)
 */
export const meetsWCAGAA = (contrast: number, largeText: boolean = false): boolean => {
  return largeText ? contrast >= 3 : contrast >= 4.5;
};

/**
 * Announce dynamic updates to screen readers
 */
export const announceDynamicUpdate = (
  message: string,
  type: 'success' | 'error' | 'info' = 'info'
): void => {
  const typeMessages = {
    success: 'Success',
    error: 'Error',
    info: 'Information',
  };

  announce(`${typeMessages[type]}: ${message}`, type === 'error' ? 'assertive' : 'polite');
};
