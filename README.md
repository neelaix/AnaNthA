# AnaNthA

Plan. Progress. Become Infinite.

A local-first task manager with a React + Vite + TypeScript frontend, an installable PWA shell, and optional Convex-powered Web Push reminders.

## Features

- Flutter app (pps/anantha_app) with dashboard, tasks, calendar, focus, analytics, notifications, settings
- Server-side task store, delta sync, offline outbox, soft deletes
- FCM HTTP v1 push for Android/iOS plus existing VAPID Web Push
- Recurrence and reminders planned server-side (timezone/DST aware)
- Local-first storage for tasks and personal settings
- Installable PWA with offline fallback
- Web Push reminders with quiet hours, priorities, retries, and a notification center
- Multi-device notification pairing via a short-lived code
- Daily motivation notifications

## Development

```powershell
npm install
npm run dev
```

```powershell
npm run lint
npm run build
```

Push notifications require a Convex deployment and VAPID keys. See [SETUP.md](./SETUP.md).

## Notes

- Tasks, categories, focus sessions, reminder configuration, notifications, devices, and preferences are stored in Convex so web and mobile share one source of truth.
- Flutter talks to Convex through the official HTTP API with a Hive cache and outbox (polling, not WebSocket).
- See docs/FLUTTER_SETUP.md for toolchain, Firebase, and build steps.
- Notification sound/vibration is ultimately controlled by the operating system.
- iOS requires 16.4+, Safari, and Add to Home Screen.
