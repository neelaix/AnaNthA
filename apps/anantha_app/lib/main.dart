import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core.dart';
import 'screens.dart';
import 'theme.dart';

// ─────────────────────────────────────────────────────────────────────────────
// FCM background handler — MUST be a top-level function (not a class method).
// Called by the OS when a data message arrives and the app is killed/background.
// Keep it minimal: no UI, no Riverpod, no BuildContext.
// ─────────────────────────────────────────────────────────────────────────────
@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  // Firebase must be initialised in every isolate that uses it.
  await Firebase.initializeApp();

  // If the message already has a notification payload, Android FCM SDK
  // displays it automatically in the system tray. Showing another one
  // here would produce duplicate notifications.
  if (message.notification != null) return;

  final title = message.data['title']?.toString();
  final body = message.data['body']?.toString();
  if (title == null && body == null) return;

  // Show a local notification for data-only background messages
  final plugin = FlutterLocalNotificationsPlugin();
  const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
  await plugin.initialize(const InitializationSettings(android: androidSettings));

  final channelId = message.data['channelId']?.toString() ?? 'task_reminders';
  final channelName = channelId == 'deadline_alerts'
      ? 'Deadline alerts'
      : (channelId == 'daily_motivation' ? 'Daily motivation' : 'Task reminders');

  await plugin.show(
    message.hashCode,
    title ?? 'ANAṆTHA',
    body ?? '',
    NotificationDetails(
      android: AndroidNotificationDetails(
        channelId,
        channelName,
        importance: channelId == 'daily_motivation' ? Importance.low : Importance.high,
        priority: channelId == 'daily_motivation' ? Priority.low : Priority.high,
        icon: '@mipmap/ic_launcher',
      ),
    ),
    payload: message.data['taskId']?.toString() ?? message.data['route']?.toString(),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Router — lives at module level so NotificationService can call _router.go()
// ─────────────────────────────────────────────────────────────────────────────
final _rootNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      final app = ref.read(appControllerProvider);
      if (!app.ready) return null;
      final onboarding = state.matchedLocation == '/onboarding';
      if (app.identity == null && !onboarding) return '/onboarding';
      if (app.identity != null && onboarding) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/tasks',
            builder: (context, state) => TasksScreen(
              highlightTaskId: state.uri.queryParameters['taskId'],
            ),
          ),
          GoRoute(
            path: '/calendar',
            builder: (context, state) => const CalendarScreen(),
          ),
          GoRoute(
            path: '/focus',
            builder: (context, state) => const FocusScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/analytics',
        builder: (context, state) => const AnalyticsScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );
});

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Register the background handler BEFORE Firebase.initializeApp().
  FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);

  await Hive.initFlutter();
  final local = await Hive.openBox('tasks');
  final meta = await Hive.openBox('meta');

  try {
    await Firebase.initializeApp();
  } catch (_) {}

  final controller = AppController(ConvexApi(), const FlutterSecureStorage(), local, meta);
  await controller.init();

  final notifications = NotificationService();
  await notifications.init();
  await notifications.bind(controller);

  runApp(
    ProviderScope(
      overrides: [
        appControllerProvider.overrideWith((ref) => controller),
        notificationServiceProvider.overrideWithValue(notifications),
      ],
      child: const AnanthaApp(),
    ),
  );
}

final notificationServiceProvider = Provider<NotificationService>((ref) => NotificationService());

class AnanthaApp extends ConsumerWidget {
  const AnanthaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'ANAṆTHA',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      routerConfig: router,
    );
  }
}

class NotificationService {
  final FlutterLocalNotificationsPlugin local = FlutterLocalNotificationsPlugin();
  StreamSubscription<String>? _tokenSub;

  Future<void> init() async {
    try {
      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const darwinSettings = DarwinInitializationSettings();
      await local.initialize(
        const InitializationSettings(android: androidSettings, iOS: darwinSettings),
        // Tap on a local notification while app is in foreground/background
        onDidReceiveNotificationResponse: _onNotificationTap,
      );

      final android = local.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();

      await android?.createNotificationChannel(const AndroidNotificationChannel(
        'task_reminders',
        'Task reminders',
        description: 'Reminders and deadlines for your tasks',
        importance: Importance.high,
      ));
      await android?.createNotificationChannel(const AndroidNotificationChannel(
        'deadline_alerts',
        'Deadline alerts',
        description: 'Urgent task deadlines and alerts',
        importance: Importance.high,
      ));
      await android?.createNotificationChannel(const AndroidNotificationChannel(
        'daily_motivation',
        'Daily motivation',
        description: 'Daily morning motivation messages',
        importance: Importance.low,
      ));

      // Request Android 13+ notification permission via local notifications plugin
      await android?.requestNotificationsPermission();
      // Request FCM permission (covers iOS alert/badge/sound too)
      await FirebaseMessaging.instance
          .requestPermission(alert: true, badge: true, sound: true);

      // Check if launched from terminated state via local notification
      final launchDetails = await local.getNotificationAppLaunchDetails();
      if (launchDetails != null && launchDetails.didNotificationLaunchApp) {
        final payload = launchDetails.notificationResponse?.payload;
        if (payload != null && payload.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Future.delayed(const Duration(milliseconds: 600), () {
              _navigatePayload(payload);
            });
          });
        }
      }
    } catch (_) {}
  }

  // Called when user taps a flutter_local_notifications notification
  void _onNotificationTap(NotificationResponse response) {
    final payload = response.payload;
    if (payload != null && payload.isNotEmpty) {
      _navigatePayload(payload);
    }
  }

  void _navigatePayload(String payload) {
    if (payload.startsWith('/')) {
      _rootNavigatorKey.currentContext?.go(payload);
    } else {
      _rootNavigatorKey.currentContext?.go('/tasks?taskId=$payload');
    }
  }

  void _handleMessageTap(RemoteMessage message) {
    final route = message.data['route']?.toString();
    final taskId = message.data['taskId']?.toString();
    if (route != null && route.isNotEmpty) {
      _rootNavigatorKey.currentContext?.go(route);
    } else if (taskId != null && taskId.isNotEmpty) {
      _rootNavigatorKey.currentContext?.go('/tasks?taskId=$taskId');
    }
  }

  Future<void> bind(AppController controller) async {
    try {
      // ── Token registration ──────────────────────────────────────────────
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await controller.registerFcm(token);

      _tokenSub?.cancel();
      _tokenSub = FirebaseMessaging.instance.onTokenRefresh
          .listen(controller.registerFcm);

      // ── Foreground messages ─────────────────────────────────────────────
      // When the app is open in foreground, FCM does not show a notification
      // by default — we display it via flutter_local_notifications.
      FirebaseMessaging.onMessage.listen((message) {
        final notification = message.notification;
        final title = notification?.title ?? message.data['title']?.toString();
        final body = notification?.body ?? message.data['body']?.toString();
        if (title == null && body == null) return;

        final channelId = message.data['channelId']?.toString() ??
            message.notification?.android?.channelId ??
            'task_reminders';
        final channelName = channelId == 'deadline_alerts'
            ? 'Deadline alerts'
            : (channelId == 'daily_motivation' ? 'Daily motivation' : 'Task reminders');

        local.show(
          message.hashCode,
          title,
          body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              channelId,
              channelName,
              importance: channelId == 'daily_motivation' ? Importance.low : Importance.high,
              priority: channelId == 'daily_motivation' ? Priority.low : Priority.high,
              icon: '@mipmap/ic_launcher',
            ),
            iOS: const DarwinNotificationDetails(),
          ),
          payload: message.data['taskId']?.toString() ?? message.data['route']?.toString(),
        );
      });

      // ── Tap on FCM notification (app in background, not killed) ─────────
      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        _handleMessageTap(message);
      });

      // ── App launched from a tapped FCM notification (app was killed) ────
      final initial = await FirebaseMessaging.instance.getInitialMessage();
      if (initial != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Future.delayed(const Duration(milliseconds: 600), () {
            _handleMessageTap(initial);
          });
        });
      }
    } catch (_) {}
  }

  Future<String?> initialTaskId() async {
    try {
      final message = await FirebaseMessaging.instance.getInitialMessage();
      return message?.data['taskId']?.toString();
    } catch (_) {
      return null;
    }
  }
}
