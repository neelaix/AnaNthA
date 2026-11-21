import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:uuid/uuid.dart';

const convexUrl = String.fromEnvironment(
  'CONVEX_URL',
  defaultValue: 'https://exciting-salmon-603.convex.cloud',
);

String get platformName {
  if (kIsWeb) return 'web';
  if (defaultTargetPlatform == TargetPlatform.android) return 'android';
  if (defaultTargetPlatform == TargetPlatform.iOS) return 'ios';
  return 'web';
}

class Identity {
  Identity({required this.workspaceId, required this.deviceId, required this.token, required this.deviceName});
  final String workspaceId;
  final String deviceId;
  final String token;
  final String deviceName;

  Map<String, dynamic> get auth => {
        'workspaceId': workspaceId,
        'deviceId': deviceId,
        'token': token,
      };
}

class ConvexApi {
  ConvexApi() : _dio = Dio(BaseOptions(baseUrl: convexUrl, connectTimeout: const Duration(seconds: 20), receiveTimeout: const Duration(seconds: 20)));
  final Dio _dio;

  Future<dynamic> _call(String kind, String path, Map<String, dynamic> args) async {
    final response = await _dio.post('/api/$kind', data: {'path': path, 'args': args, 'format': 'json', 'version': 1});
    final body = response.data;
    if (body is Map && body['status'] == 'success') return body['value'];
    final message = body is Map ? (body['errorMessage'] ?? body['error'] ?? 'Request failed') : 'Request failed';
    throw Exception(message);
  }

  Future<dynamic> query(String path, Map<String, dynamic> args) => _call('query', path, args);
  Future<dynamic> mutation(String path, Map<String, dynamic> args) => _call('mutation', path, args);
  Future<dynamic> action(String path, Map<String, dynamic> args) => _call('action', path, args);
}

class Task {
  Task({
    required this.taskId,
    required this.title,
    this.description,
    this.notes,
    this.priority = 'medium',
    this.categoryId = 'personal',
    this.tags = const [],
    this.deadline,
    this.completed = false,
    this.completedAt,
    this.reminder,
    this.recurrence,
    this.deletedAt,
    this.updatedAt = 0,
    this.seq = 0,
  });

  final String taskId;
  String title;
  String? description;
  String? notes;
  String priority;
  String categoryId;
  List<String> tags;
  DateTime? deadline;
  bool completed;
  DateTime? completedAt;
  Map<String, dynamic>? reminder;
  Map<String, dynamic>? recurrence;
  DateTime? deletedAt;
  int updatedAt;
  int seq;

  factory Task.fromMap(Map<String, dynamic> map) => Task(
        taskId: map['taskId'] as String,
        title: map['title'] as String? ?? 'Untitled',
        description: map['description'] as String?,
        notes: map['notes'] as String?,
        priority: map['priority'] as String? ?? 'medium',
        categoryId: map['categoryId'] as String? ?? 'personal',
        tags: (map['tags'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        deadline: map['deadline'] == null ? null : DateTime.fromMillisecondsSinceEpoch((map['deadline'] as num).toInt()),
        completed: map['completed'] as bool? ?? false,
        completedAt: map['completedAt'] == null ? null : DateTime.fromMillisecondsSinceEpoch((map['completedAt'] as num).toInt()),
        reminder: (map['reminder'] as Map?)?.cast<String, dynamic>(),
        recurrence: (map['recurrence'] as Map?)?.cast<String, dynamic>(),
        deletedAt: map['deletedAt'] == null ? null : DateTime.fromMillisecondsSinceEpoch((map['deletedAt'] as num).toInt()),
        updatedAt: (map['updatedAt'] as num?)?.toInt() ?? 0,
        seq: (map['seq'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toMap() => {
        'taskId': taskId,
        'title': title,
        'description': description,
        'notes': notes,
        'priority': priority,
        'categoryId': categoryId,
        'tags': tags,
        'deadline': deadline?.millisecondsSinceEpoch,
        'completed': completed,
        'completedAt': completedAt?.millisecondsSinceEpoch,
        'reminder': reminder,
        'recurrence': recurrence,
        'deletedAt': deletedAt?.millisecondsSinceEpoch,
        'updatedAt': updatedAt,
        'seq': seq,
      };

  Map<String, dynamic> serverPayload() {
    final map = <String, dynamic>{
      'taskId': taskId,
      'title': title,
      'priority': priority,
      'categoryId': categoryId,
      'tags': tags,
      'completed': completed,
    };
    if (description != null && description!.isNotEmpty) map['description'] = description;
    if (notes != null && notes!.isNotEmpty) map['notes'] = notes;
    if (deadline != null) map['deadline'] = deadline!.millisecondsSinceEpoch;
    if (completedAt != null) map['completedAt'] = completedAt!.millisecondsSinceEpoch;
    if (reminder != null) map['reminder'] = reminder;
    if (recurrence != null) map['recurrence'] = recurrence;
    return map;
  }

  Task copyWith({
    String? title,
    String? description,
    String? priority,
    String? categoryId,
    DateTime? deadline,
    bool? completed,
    DateTime? completedAt,
    Map<String, dynamic>? reminder,
    bool clearCompletedAt = false,
  }) =>
      Task(
        taskId: taskId,
        title: title ?? this.title,
        description: description ?? this.description,
        notes: notes,
        priority: priority ?? this.priority,
        categoryId: categoryId ?? this.categoryId,
        tags: tags,
        deadline: deadline ?? this.deadline,
        completed: completed ?? this.completed,
        completedAt: clearCompletedAt ? null : (completedAt ?? this.completedAt),
        reminder: reminder ?? this.reminder,
        recurrence: recurrence,
        updatedAt: updatedAt,
        seq: seq,
      );
}

class AppState {
  AppState({
    this.identity,
    this.tasks = const [],
    this.preferences = const {},
    this.online = true,
    this.busy = false,
    this.error,
    this.ready = false,
  });

  final Identity? identity;
  final List<Task> tasks;
  final Map<String, dynamic> preferences;
  final bool online;
  final bool busy;
  final String? error;
  final bool ready;

  AppState copyWith({
    Identity? identity,
    List<Task>? tasks,
    Map<String, dynamic>? preferences,
    bool? online,
    bool? busy,
    String? error,
    bool? ready,
    bool clearError = false,
  }) =>
      AppState(
        identity: identity ?? this.identity,
        tasks: tasks ?? this.tasks,
        preferences: preferences ?? this.preferences,
        online: online ?? this.online,
        busy: busy ?? this.busy,
        error: clearError ? null : (error ?? this.error),
        ready: ready ?? this.ready,
      );
}

class AppController extends StateNotifier<AppState> {
  AppController(this.api, this.secure, this.local, this.meta) : super(AppState()) {
    _watchConnectivity();
  }

  final ConvexApi api;
  final FlutterSecureStorage secure;
  final Box local;
  final Box meta;

  Future<void> init() async {
    final identity = await _readIdentity();
    final cached = local.values.map((e) => Task.fromMap((e as Map).cast<String, dynamic>())).toList();
    state = state.copyWith(identity: identity, tasks: cached, ready: true);
    if (identity == null) return;
    await refresh();
  }

  void _watchConnectivity() {
    Connectivity().onConnectivityChanged.listen((result) {
      final online = result.any((item) => item != ConnectivityResult.none);
      state = state.copyWith(online: online);
      if (online) refresh();
    });
  }

  Future<Identity?> _readIdentity() async {
    final workspaceId = await secure.read(key: 'workspaceId');
    final deviceId = await secure.read(key: 'deviceId');
    final token = await secure.read(key: 'token');
    if (workspaceId == null || deviceId == null || token == null) return null;
    return Identity(
      workspaceId: workspaceId,
      deviceId: deviceId,
      token: token,
      deviceName: await secure.read(key: 'deviceName') ?? 'This device',
    );
  }

  Future<void> _saveIdentity(Identity identity) async {
    await secure.write(key: 'workspaceId', value: identity.workspaceId);
    await secure.write(key: 'deviceId', value: identity.deviceId);
    await secure.write(key: 'token', value: identity.token);
    await secure.write(key: 'deviceName', value: identity.deviceName);
  }

  String _deviceName() {
    if (kIsWeb) return 'Web browser';
    return '${defaultTargetPlatform.name} device';
  }

  Future<String?> createWorkspace() async {
    state = state.copyWith(busy: true, clearError: true);
    try {
      final deviceId = const Uuid().v4();
      final token = const Uuid().v4().replaceAll('-', '') + const Uuid().v4().replaceAll('-', '');
      final tokenHash = sha256.convert(utf8.encode(token)).toString();
      final result = await api.mutation('workspaces:create', {
        'deviceId': deviceId,
        'deviceName': _deviceName(),
        'tokenHash': tokenHash,
        'userAgent': 'Flutter $platformName',
        'platform': platformName,
      });
      final identity = Identity(
        workspaceId: result['workspaceId'] as String,
        deviceId: deviceId,
        token: token,
        deviceName: _deviceName(),
      );
      await _saveIdentity(identity);
      state = state.copyWith(identity: identity, busy: false, ready: true);
      await refresh();
      return result['pairCode'] as String?;
    } catch (error) {
      state = state.copyWith(busy: false, error: error.toString());
      return null;
    }
  }

  Future<bool> joinWorkspace(String code) async {
    state = state.copyWith(busy: true, clearError: true);
    try {
      final deviceId = const Uuid().v4();
      final token = const Uuid().v4().replaceAll('-', '') + const Uuid().v4().replaceAll('-', '');
      final tokenHash = sha256.convert(utf8.encode(token)).toString();
      final result = await api.mutation('workspaces:join', {
        'pairCode': code.trim().toUpperCase(),
        'deviceId': deviceId,
        'deviceName': _deviceName(),
        'tokenHash': tokenHash,
        'userAgent': 'Flutter $platformName',
        'platform': platformName,
      });
      final identity = Identity(
        workspaceId: result['workspaceId'] as String,
        deviceId: deviceId,
        token: token,
        deviceName: _deviceName(),
      );
      await _saveIdentity(identity);
      state = state.copyWith(identity: identity, busy: false, ready: true, clearError: true);
      await refresh();
      return true;
    } catch (error) {
      state = state.copyWith(busy: false, error: error.toString());
      return false;
    }
  }

  Future<String?> pairingCode() async {
    final identity = state.identity;
    if (identity == null) return null;
    try {
      final result = await api.mutation('workspaces:refreshPairCode', identity.auth);
      return result['pairCode'] as String?;
    } catch (error) {
      state = state.copyWith(error: error.toString());
      return null;
    }
  }

  Future<void> refresh() async {
    final identity = state.identity;
    if (identity == null) return;
    try {
      await _flushOutbox();
      final cursor = (meta.get('cursor') as num?)?.toInt() ?? 0;
      var next = cursor;
      var hasMore = true;
      final merged = {for (final task in state.tasks) task.taskId: task};
      var guard = 0;
      while (hasMore && guard < 20) {
        guard += 1;
        final result = await api.query('sync:pull', {...identity.auth, 'cursor': next, 'limit': 100});
        for (final raw in (result['tasks'] as List)) {
          final task = Task.fromMap((raw as Map).cast<String, dynamic>());
          if (task.deletedAt != null) {
            merged.remove(task.taskId);
          } else {
            merged[task.taskId] = task;
          }
        }
        next = (result['cursor'] as num).toInt();
        hasMore = result['hasMore'] as bool? ?? false;
      }
      meta.put('cursor', next);
      final prefs = await api.query('preferences:get', identity.auth);
      final tasks = merged.values.toList()..sort((a, b) => (a.deadline ?? DateTime(2100)).compareTo(b.deadline ?? DateTime(2100)));
      state = state.copyWith(tasks: tasks, preferences: (prefs as Map).cast<String, dynamic>(), online: true, clearError: true);
      await _persist(tasks);
    } catch (error) {
      state = state.copyWith(online: false, error: error.toString());
    }
  }

  Future<void> _persist(List<Task> tasks) async {
    await local.clear();
    for (final task in tasks) {
      await local.put(task.taskId, task.toMap());
    }
  }

  Future<void> _enqueue(String path, Map<String, dynamic> args) async {
    final outbox = (meta.get('outbox') as List?)?.cast<Map>() ?? [];
    outbox.add({'path': path, 'args': args});
    meta.put('outbox', outbox);
  }

  Future<void> _flushOutbox() async {
    final identity = state.identity;
    if (identity == null) return;
    final outbox = (meta.get('outbox') as List?)?.cast<Map>() ?? [];
    if (outbox.isEmpty) return;
    final remaining = <Map>[];
    for (final item in outbox) {
      try {
        await api.mutation(item['path'] as String, {...identity.auth, ...(item['args'] as Map).cast<String, dynamic>()});
      } catch (_) {
        remaining.add(item);
      }
    }
    meta.put('outbox', remaining);
  }

  Future<void> saveTask(Task task) async {
    final identity = state.identity;
    if (identity == null) return;
    final exists = state.tasks.any((item) => item.taskId == task.taskId);
    final next = [...state.tasks];
    if (exists) {
      next[next.indexWhere((item) => item.taskId == task.taskId)] = task;
    } else {
      next.add(task);
    }
    state = state.copyWith(tasks: next);
    await _persist(next);
    final payload = task.serverPayload();
    payload['timezone'] = DateTime.now().timeZoneName;
    payload['clientUpdatedAt'] = DateTime.now().millisecondsSinceEpoch;
    try {
      await api.mutation('tasks:upsert', {...identity.auth, 'task': payload});
    } catch (_) {
      await _enqueue('tasks:upsert', {'task': payload});
    }
  }

  Future<void> toggleTask(Task task) async {
    final identity = state.identity;
    if (identity == null) return;
    final updated = task.copyWith(
      completed: !task.completed,
      completedAt: task.completed ? null : DateTime.now(),
      clearCompletedAt: task.completed,
    );
    final next = [...state.tasks];
    next[next.indexWhere((item) => item.taskId == task.taskId)] = updated;
    state = state.copyWith(tasks: next);
    await _persist(next);
    try {
      await api.mutation('tasks:setCompleted', {...identity.auth, 'taskId': task.taskId, 'completed': updated.completed});
    } catch (_) {
      await _enqueue('tasks:setCompleted', {'taskId': task.taskId, 'completed': updated.completed});
    }
  }

  Future<void> deleteTask(Task task) async {
    final identity = state.identity;
    if (identity == null) return;
    final next = state.tasks.where((item) => item.taskId != task.taskId).toList();
    state = state.copyWith(tasks: next);
    await _persist(next);
    try {
      await api.mutation('tasks:remove', {...identity.auth, 'taskId': task.taskId});
    } catch (_) {
      await _enqueue('tasks:remove', {'taskId': task.taskId});
    }
  }

  Future<void> updatePreferences(Map<String, dynamic> patch) async {
    final identity = state.identity;
    if (identity == null) return;
    final next = {...state.preferences, ...patch};
    state = state.copyWith(preferences: next);
    try {
      await api.mutation('preferences:update', {...identity.auth, ...patch});
    } catch (error) {
      state = state.copyWith(error: error.toString());
    }
  }

  Future<void> recordFocus({required int minutes, String? taskId, required bool completed}) async {
    final identity = state.identity;
    if (identity == null) return;
    final now = DateTime.now();
    try {
      await api.mutation('focus:record', {
        ...identity.auth,
        'sessionId': const Uuid().v4(),
        'taskId': taskId,
        'kind': 'focus',
        'startedAt': now.subtract(Duration(minutes: minutes)).millisecondsSinceEpoch,
        'endedAt': now.millisecondsSinceEpoch,
        'plannedMinutes': minutes,
        'completed': completed,
        'timezone': now.timeZoneName,
      });
    } catch (_) {}
  }

  Future<List<Map<String, dynamic>>> notifications() async {
    final identity = state.identity;
    if (identity == null) return [];
    try {
      final result = await api.query('notifications:list', {...identity.auth, 'limit': 100});
      return (result as List).map((item) => (item as Map).cast<String, dynamic>()).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> markNotificationsRead({String? id}) async {
    final identity = state.identity;
    if (identity == null) return;
    try {
      if (id == null) {
        await api.mutation('notifications:markAllRead', identity.auth);
      } else {
        await api.mutation('notifications:markRead', {...identity.auth, 'notificationId': id});
      }
    } catch (_) {}
  }

  Future<String?> sendTestNotification() async {
    final identity = state.identity;
    if (identity == null) return null;
    try {
      await api.action('push:sendTest', identity.auth);
      return null;
    } catch (error) {
      return error.toString();
    }
  }

  Future<void> registerFcm(String token) async {
    final identity = state.identity;
    if (identity == null) return;
    try {
      await api.mutation('fcm:registerToken', {
        ...identity.auth,
        'token': token,
        'platform': platformName,
      });
    } catch (_) {}
  }

  Future<void> signOut() async {
    await secure.deleteAll();
    await local.clear();
    meta.clear();
    state = AppState(ready: true);
  }
}

final apiProvider = Provider((ref) => ConvexApi());
final secureProvider = Provider((ref) => const FlutterSecureStorage());
final appControllerProvider = StateNotifierProvider<AppController, AppState>((ref) {
  throw UnimplementedError('initialized in main');
});
