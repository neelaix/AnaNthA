import { ConvexReactClient } from 'convex/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim() ?? '';

export const convexEnabled = Boolean(convexUrl);
export const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim() ?? '';

export const convexSiteUrl = (() => {
  const explicit = import.meta.env.VITE_CONVEX_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  if (!convexUrl) return '';
  try {
    const url = new URL(convexUrl);
    url.host = url.host.replace('.convex.cloud', '.convex.site');
    return url.origin;
  } catch {
    return '';
  }
})();
