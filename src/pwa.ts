import { registerSW } from 'virtual:pwa-register';

export function registerPwa(): void {
  if (!('serviceWorker' in navigator)) return;
  if (window.location.hostname === 'localhost' || window.location.protocol === 'https:') {
    registerSW({ immediate: true });
  }
}
