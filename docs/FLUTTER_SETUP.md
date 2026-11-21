# ANAṆTHA Flutter (Android / iOS / Web)

The Flutter app lives in `apps/anantha_app` and shares the existing Convex backend.

## 1. Toolchain (this machine)

```powershell
winget install --id Google.Flutter --source winget
winget install --id EclipseAdoptium.Temurin.17.JDK --source winget
winget install --id Google.AndroidStudio --source winget
```

Set `JAVA_HOME` to the Temurin 17 folder, then:

```powershell
flutter doctor --android-licenses
flutter config --enable-web
flutter doctor -v
```

## 2. Generate platform folders

The Dart source is committed; native folders are generated once:

```powershell
cd apps/anantha_app
flutter create --platforms=android,ios,web --org app.anantha --project-name anantha .
flutter pub get
```

Flutter will not overwrite `lib/`, `pubspec.yaml`.

## 3. Run

```powershell
flutter run -d chrome --dart-define=CONVEX_URL=https://exciting-salmon-603.convex.cloud
flutter run -d <android-device>
```

## 4. Build web into the landing site

```powershell
flutter build web --release --base-href=/app/ --pwa-strategy=none --dart-define=CONVEX_URL=https://exciting-salmon-603.convex.cloud
node scripts/copy-flutter-web.mjs
npm run build
```

`copy-flutter-web.mjs` copies the build into `public/app/` (stripping
`.symbols`/`.map` files). Vite then ships it with the landing site, so the
Flutter web app is available at `/app` without building Flutter on Vercel.
`public/app/` is committed for that reason — re-run the script after every
Flutter change. `vercel.json` rewrites `/app/*` to `/app/index.html` and the
root PWA service worker denylists `/app/`.

## 5. Firebase

1. Create a Firebase project and add Android, iOS, and Web apps with IDs:
   - `app.anantha.anantha`
   - `app.anantha.anantha` (iOS bundle)
   - Web app for `www.anantha.sbs`
2. Place `google-services.json` in `android/app/` and
   `GoogleService-Info.plist` in `ios/Runner/`.
3. Upload the APNs auth key (`.p8`, Key ID + Team ID) in Firebase Cloud Messaging.
4. Web: put the Firebase web config values into `web/index.html` before the app
   script and add `web/firebase-messaging-sw.js`.
5. Set the backend secret:

```powershell
npx convex env set FIREBASE_SERVICE_ACCOUNT (Get-Content service-account.json -Raw)
```

The server uses FCM HTTP v1 (RS256 service-account JWT). Web Push VAPID keeps
working for browsers; mobile uses FCM.

## 6. What is implemented

- Shared workspace identity (create / join / pairing code) with secure storage
- Delta sync (`sync:pull` cursor + outbox replay), offline queue, soft deletes
- Dashboard, task CRUD, reminders, categories, priorities, search/filter
- Calendar month view, focus timer with recorded sessions, analytics
- Notification center and settings, FCM token registration, deep-link route
- Server-side reminders, retries, quiet hours, delivery records (existing engine)
- FCM fan-out to Android/iOS via Convex Node action

## 7. Verification gates

```powershell
flutter analyze
flutter test
flutter build apk --release
```

iOS requires macOS/Xcode or Codemagic; see `.github/workflows/flutter.yml`.
Real push delivery requires the Firebase credentials above.
