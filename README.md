# AnaNthA

Plan. Progress. Become Infinite.

A local-first task manager with a React + Vite + TypeScript frontend, an installable PWA shell, and optional Convex-powered Web Push reminders.

## Features

- Tasks, categories, recurrence, analytics, and focus mode
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

- Tasks and reminder configuration stay on-device; only reminders, notification history, device subscriptions, and notification preferences sync to Convex.
- Notification sound/vibration is ultimately controlled by the operating system.
- iOS requires 16.4+, Safari, and Add to Home Screen.
