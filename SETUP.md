# ANAṆTHA Web Push Setup

Push reminders use Convex for scheduling/history and standard Web Push (VAPID) for delivery. No Firebase account is required.

## 1. Create the Convex deployment

```powershell
npx convex dev
```

Log in when prompted. This creates `convex/_generated/*` (replacing the temporary shims), provisions dev/prod deployments, and prints your deployment URL.

Keep `npx convex dev` running while developing.

## 2. Generate VAPID keys

```powershell
node -e "const wp=require('web-push');console.log(wp.generateVAPIDKeys())"
```

## 3. Set backend secrets

```powershell
npx convex env set VAPID_PUBLIC_KEY "PUBLIC_KEY_FROM_STEP_2"
npx convex env set VAPID_PRIVATE_KEY "PRIVATE_KEY_FROM_STEP_2"
npx convex env set VAPID_SUBJECT "mailto:you@example.com"
```

For production, add `--prod` to each command. Never put the private key in a `VITE_*` variable or commit it.

## 4. Configure the frontend

Copy `.env.example` to `.env.local` and fill in:

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
VITE_VAPID_PUBLIC_KEY=PUBLIC_KEY_FROM_STEP_2
```

`VITE_CONVEX_SITE_URL` is optional when the URL follows the standard `.convex.cloud` → `.convex.site` pattern.

## 5. Run locally

```powershell
npm run dev
```

Open **Notifications** in the sidebar, enable push, then press **Send test notification**.

Localhost is treated as a secure context, so HTTPS is not needed locally.

## 6. Deploy

```powershell
npx convex deploy
npm run build
```

Deploy `dist/` to any HTTPS host. Push will not work over plain HTTP on a real domain.

## Device support

| Platform | Requirement |
| --- | --- |
| Android Chrome | Installable PWA; notifications work in browser and installed app |
| Desktop Chrome/Edge | Works after granting permission |
| iPhone/iPad | iOS 16.4+, Safari, **Add to Home Screen**, then enable notifications inside the installed app |
| Firefox | Works after granting permission |

If permission was denied, reset it in the browser/OS site settings. The Notifications page lists platform-specific steps.

## How it works

- Tasks and reminder settings stay in local storage; only reminder occurrences, notification history, devices, and preferences sync to Convex.
- The client plans the next 30 days of occurrences and syncs them (`occurrenceId = taskId:fireAt` prevents duplicates).
- A Convex cron runs every minute, claims due reminders, respects preferences/quiet hours, and sends via Web Push.
- Expired subscriptions (404/410) are removed automatically; transient failures retry with backoff.
- The notification bell reads synced history. Tapping a push opens the related task.
- Quiet hours defer non-urgent reminders; high-priority reminders bypass them when that preference is enabled.

## Known limitation

The final sound and vibration are controlled by the operating system/browser. A web app can request default, soft, urgent, or silent behavior, but it cannot force a custom audio file to play.

## Troubleshooting

- **"Backend not configured"**: check `.env.local`, restart Vite, and confirm `VITE_VAPID_PUBLIC_KEY` matches the Convex env value.
- **Test says no subscription**: enable push on that device first and allow the permission prompt.
- **No notification while app is closed**: install the PWA; some browsers throttle non-installed web apps.
- **iPhone**: verify iOS 16.4+, open from the Home Screen icon, and allow notifications in iOS Settings.
- **Regenerate types**: run `npx convex dev` after changing `convex/schema.ts` or functions.
