import 'dart:async';

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

import 'core.dart';
import 'theme.dart';

const categories = ['personal', 'work', 'study', 'projects', 'health', 'finance'];
const priorities = ['low', 'medium', 'high', 'urgent'];

Color priorityColor(String priority) => switch (priority) {
      'urgent' => Brand.danger,
      'high' => Brand.warning,
      'low' => Brand.success,
      _ => Brand.lavender,
    };

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.path;
    final index = location.startsWith('/tasks')
        ? 1
        : location.startsWith('/calendar')
            ? 2
            : location.startsWith('/focus')
                ? 3
                : location.startsWith('/profile')
                    ? 4
                    : 0;

    return GradientBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: [Brand.lavender, Brand.violet]),
                ),
                child: const Center(child: Text('∞', style: TextStyle(fontWeight: FontWeight.w800, height: 1.4))),
              ),
              const SizedBox(width: 10),
              const Text('ANAṆTHA'),
            ],
          ),
          actions: [
            IconButton(
              tooltip: 'Notifications',
              onPressed: () => context.push('/notifications'),
              icon: const Icon(Icons.notifications_none_rounded),
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: SafeArea(child: child),
        bottomNavigationBar: NavigationBar(
          selectedIndex: index,
          onDestinationSelected: (value) => switch (value) {
            1 => context.go('/tasks'),
            2 => context.go('/calendar'),
            3 => context.go('/focus'),
            4 => context.go('/profile'),
            _ => context.go('/'),
          },
          destinations: const [
            NavigationDestination(icon: Icon(Icons.grid_view_rounded), label: 'Home'),
            NavigationDestination(icon: Icon(Icons.check_circle_outline_rounded), label: 'Tasks'),
            NavigationDestination(icon: Icon(Icons.calendar_month_outlined), label: 'Calendar'),
            NavigationDestination(icon: Icon(Icons.timer_outlined), label: 'Focus'),
            NavigationDestination(icon: Icon(Icons.person_outline_rounded), label: 'Profile'),
          ],
        ),
      ),
    );
  }
}

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});
  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final code = TextEditingController();
  bool joining = false;

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final controller = ref.read(appControllerProvider.notifier);
    return GradientBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(28),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 24),
                    Center(
                      child: Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(colors: [Brand.lavenderSoft, Brand.violet]),
                          boxShadow: [BoxShadow(color: Brand.violet.withOpacity(0.45), blurRadius: 48)],
                        ),
                        child: const Center(child: Text('∞', style: TextStyle(fontSize: 46, fontWeight: FontWeight.w800))),
                      ),
                    ).animate().fadeIn(duration: const Duration(milliseconds: 700)).scale(),
                    const SizedBox(height: 28),
                    Text('ANAṆTHA', textAlign: TextAlign.center, style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 38)),
                    const SizedBox(height: 6),
                    Text('Plan. Progress. Become Infinite.', textAlign: TextAlign.center, style: TextStyle(color: Brand.softWhite.withOpacity(0.62), fontSize: 15)),
                    const SizedBox(height: 36),
                    GlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text('Start your workspace', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 6),
                          Text('Your tasks sync across web, Android and iOS.', style: TextStyle(color: Brand.softWhite.withOpacity(0.55), fontSize: 13)),
                          const SizedBox(height: 18),
                          PrimaryButton(
                            label: 'Create workspace',
                            icon: Icons.auto_awesome_rounded,
                            busy: app.busy && !joining,
                            onPressed: () async {
                              final pairCode = await controller.createWorkspace();
                              if (!context.mounted) return;
                              if (pairCode != null) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Workspace ready. Pairing code: $pairCode')));
                                context.go('/');
                              }
                            },
                          ),
                          if (app.error != null) ...[
                            const SizedBox(height: 12),
                            Text(app.error!, style: const TextStyle(color: Brand.danger, fontSize: 12)),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    GlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text('Join an existing workspace', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 12),
                          TextField(
                            controller: code,
                            textCapitalization: TextCapitalization.characters,
                            decoration: const InputDecoration(hintText: 'Pairing code'),
                          ),
                          const SizedBox(height: 12),
                          PrimaryButton(
                            label: 'Join with code',
                            icon: Icons.link_rounded,
                            busy: app.busy && joining,
                            onPressed: () async {
                              setState(() => joining = true);
                              final ok = await controller.joinWorkspace(code.text);
                              setState(() => joining = false);
                              if (!context.mounted) return;
                              if (ok) context.go('/');
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final app = ref.watch(appControllerProvider);
    final controller = ref.read(appControllerProvider.notifier);
    final now = DateTime.now();
    final today = app.tasks.where((task) => task.deadline != null && DateUtils.isSameDay(task.deadline, now)).toList();
    final completed = app.tasks.where((task) => task.completed).length;
    final pending = app.tasks.where((task) => !task.completed).length;
    final overdue = app.tasks.where((task) => !task.completed && task.deadline != null && task.deadline!.isBefore(now)).length;
    final dueToday = today.isEmpty ? 1 : today.length;
    final doneToday = today.where((task) => task.completed).length;
    final progress = today.isEmpty ? (completed / (completed + pending == 0 ? 1 : completed + pending)) : doneToday / dueToday;
    final priorities = app.tasks.where((task) => !task.completed && (task.priority == 'high' || task.priority == 'urgent')).take(4).toList();

    return RefreshIndicator(
      onRefresh: controller.refresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
        children: [
          Text(greeting(), style: TextStyle(color: Brand.softWhite.withOpacity(0.6), fontSize: 14)),
          const SizedBox(height: 4),
          Text(DateFormat('EEEE, MMMM d').format(now), style: Theme.of(context).textTheme.headlineMedium),
          if (!app.online)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text('Offline — changes will sync when you reconnect', style: TextStyle(color: Brand.warning.withOpacity(0.9), fontSize: 12)),
            ),
          const SizedBox(height: 20),
          GlassCard(
            child: Row(
              children: [
                ProgressRing(value: progress.toDouble()),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _stat('Completed', '$completed', Brand.success),
                      const SizedBox(height: 10),
                      _stat('Pending', '$pending', Brand.warning),
                      const SizedBox(height: 10),
                      _stat('Overdue', '$overdue', Brand.danger),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn().slideY(begin: 0.06),
          const SizedBox(height: 18),
          SectionTitle(title: 'Today', action: TextButton(onPressed: () => context.go('/tasks'), child: const Text('All tasks'))),
          if (today.isEmpty)
            GlassCard(
              child: Text('No deadlines today. Use the space to move something meaningful forward.', style: TextStyle(color: Brand.softWhite.withOpacity(0.6))),
            )
          else
            ...today.take(5).map((task) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _TaskTile(task: task),
                )),
          const SizedBox(height: 18),
          const SectionTitle(title: 'Focus now'),
          if (priorities.isEmpty)
            GlassCard(child: Text('High-priority tasks will appear here.', style: TextStyle(color: Brand.softWhite.withOpacity(0.6))))
          else
            ...priorities.map((task) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _TaskTile(task: task),
                )),
          const SizedBox(height: 18),
          GlassCard(
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, color: Brand.lavender),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    motivation[now.day % motivation.length],
                    style: TextStyle(color: Brand.softWhite.withOpacity(0.8), fontStyle: FontStyle.italic),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _stat(String label, String value, Color color) {
    return Row(
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 8),
        Text(label, style: TextStyle(color: Brand.softWhite.withOpacity(0.62), fontSize: 13)),
        const Spacer(),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
      ],
    );
  }
}

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key, this.highlightTaskId});
  final String? highlightTaskId;
  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> {
  String filter = 'all';
  String query = '';
  bool _highlightHandled = false;

  @override
  void initState() {
    super.initState();
    _handleHighlight();
  }

  @override
  void didUpdateWidget(TasksScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.highlightTaskId != null && widget.highlightTaskId != oldWidget.highlightTaskId) {
      _highlightHandled = false;
      _handleHighlight();
    }
  }

  void _handleHighlight() {
    if (widget.highlightTaskId == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _highlightHandled) return;
      final app = ref.read(appControllerProvider);
      final match = app.tasks.where((t) => t.taskId == widget.highlightTaskId).firstOrNull;
      if (match != null) {
        _highlightHandled = true;
        showTaskEditor(context, ref, match);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final controller = ref.read(appControllerProvider.notifier);
    var tasks = app.tasks.where((task) {
      if (filter == 'today') return task.deadline != null && DateUtils.isSameDay(task.deadline, DateTime.now());
      if (filter == 'pending') return !task.completed;
      if (filter == 'completed') return task.completed;
      if (filter == 'important') return task.priority == 'high' || task.priority == 'urgent';
      return true;
    }).where((task) => query.isEmpty || task.title.toLowerCase().contains(query.toLowerCase())).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton(
        backgroundColor: Brand.violet,
        onPressed: () => showTaskEditor(context, ref, null),
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: TextField(
              decoration: const InputDecoration(hintText: 'Search tasks...', prefixIcon: Icon(Icons.search)),
              onChanged: (value) => setState(() => query = value),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 6),
            child: Row(
              children: ['all', 'today', 'pending', 'completed', 'important']
                  .map((item) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(item[0].toUpperCase() + item.substring(1)),
                          selected: filter == item,
                          onSelected: (_) => setState(() => filter = item),
                        ),
                      ))
                  .toList(),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: controller.refresh,
              child: tasks.isEmpty
                  ? ListView(children: [const SizedBox(height: 120), Center(child: Text('Nothing here yet.', style: TextStyle(color: Brand.softWhite.withOpacity(0.5))))])
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(20, 6, 20, 100),
                      itemCount: tasks.length,
                      itemBuilder: (context, index) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Dismissible(
                          key: ValueKey(tasks[index].taskId),
                          background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 24),
                            decoration: BoxDecoration(color: Brand.danger.withOpacity(0.2), borderRadius: BorderRadius.circular(24)),
                            child: const Icon(Icons.delete_outline, color: Brand.danger),
                          ),
                          onDismissed: (_) => controller.deleteTask(tasks[index]),
                          child: _TaskTile(
                            task: tasks[index],
                            highlighted: tasks[index].taskId == widget.highlightTaskId,
                          ),
                        ),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TaskTile extends ConsumerWidget {
  const _TaskTile({required this.task, this.highlighted = false});
  final Task task;
  final bool highlighted;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(appControllerProvider.notifier);
    final due = task.deadline == null ? null : DateFormat('MMM d, HH:mm').format(task.deadline!);
    return Container(
      decoration: highlighted
          ? BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Brand.violet, width: 2),
              boxShadow: [
                BoxShadow(color: Brand.violet.withOpacity(0.35), blurRadius: 12, spreadRadius: 1),
              ],
            )
          : null,
      child: GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => controller.toggleTask(task),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: task.completed ? Brand.success.withOpacity(0.25) : Colors.transparent,
                border: Border.all(color: task.completed ? Brand.success : Brand.softWhite.withOpacity(0.3), width: 2),
              ),
              child: task.completed ? const Icon(Icons.check, size: 16, color: Brand.success) : null,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: GestureDetector(
              onTap: () => showTaskEditor(context, ref, task),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    task.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      decoration: task.completed ? TextDecoration.lineThrough : null,
                      color: task.completed ? Brand.softWhite.withOpacity(0.45) : Brand.softWhite,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(color: priorityColor(task.priority), shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 6),
                      Text(task.categoryId, style: TextStyle(fontSize: 11, color: Brand.softWhite.withOpacity(0.5))),
                      if (due != null) ...[
                        const SizedBox(width: 10),
                        Icon(Icons.schedule, size: 12, color: Brand.softWhite.withOpacity(0.4)),
                        const SizedBox(width: 4),
                        Text(due, style: TextStyle(fontSize: 11, color: Brand.softWhite.withOpacity(0.5))),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
          IconButton(
            onPressed: () => showTaskEditor(context, ref, task),
            icon: Icon(Icons.edit_outlined, size: 18, color: Brand.softWhite.withOpacity(0.38)),
          ),
        ],
      ),
    ));
  }
}

Future<void> showTaskEditor(BuildContext context, WidgetRef ref, Task? existing) async {
  final title = TextEditingController(text: existing?.title ?? '');
  final description = TextEditingController(text: existing?.description ?? '');
  var priority = existing?.priority ?? 'medium';
  var category = existing?.categoryId ?? 'personal';
  DateTime? deadline = existing?.deadline;
  int reminderOffset = (existing?.reminder?['offsets'] as List?)?.isNotEmpty == true
      ? ((existing!.reminder!['offsets'] as List).first as num).toInt()
      : 30;
  var remindersOn = existing?.reminder?['enabled'] as bool? ?? true;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (dialogContext, setState) => AlertDialog(
        backgroundColor: Brand.surface,
        title: Text(existing == null ? 'New task' : 'Edit task'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: title, decoration: const InputDecoration(hintText: 'Title')),
              const SizedBox(height: 12),
              TextField(controller: description, maxLines: 3, decoration: const InputDecoration(hintText: 'Description')),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: priority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: priorities.map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
                onChanged: (value) => setState(() => priority = value ?? 'medium'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: categories.map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
                onChanged: (value) => setState(() => category = value ?? 'personal'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final date = await showDatePicker(
                          context: dialogContext,
                          firstDate: DateTime.now().subtract(const Duration(days: 365)),
                          lastDate: DateTime.now().add(const Duration(days: 3650)),
                          initialDate: deadline ?? DateTime.now(),
                        );
                        if (date == null) return;
                        final time = await showTimePicker(
                          context: dialogContext,
                          initialTime: TimeOfDay.fromDateTime(deadline ?? DateTime.now()),
                        );
                        setState(() => deadline = DateTime(date.year, date.month, date.day, time?.hour ?? 9, time?.minute ?? 0));
                      },
                      icon: const Icon(Icons.event),
                      label: Text(deadline == null ? 'Deadline' : DateFormat('MMM d, HH:mm').format(deadline!)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Reminder'),
                value: remindersOn,
                onChanged: (value) => setState(() => remindersOn = value),
              ),
              if (remindersOn)
                DropdownButtonFormField<int>(
                  value: reminderOffset,
                  decoration: const InputDecoration(labelText: 'Remind me'),
                  items: const [0, 5, 10, 15, 30, 60, 1440]
                      .map((item) => DropdownMenuItem(value: item, child: Text(item == 0 ? 'At deadline' : '$item min before')))
                      .toList(),
                  onChanged: (value) => setState(() => reminderOffset = value ?? 30),
                ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final trimmed = title.text.trim();
              if (trimmed.isEmpty) return;
              final task = existing?.copyWith(
                    title: trimmed,
                    description: description.text.trim(),
                    priority: priority,
                    categoryId: category,
                    deadline: deadline,
                    reminder: remindersOn
                        ? {
                            'enabled': true,
                            'offsets': reminderOffset == 0 ? <int>[] : <int>[reminderOffset],
                            'notifyAtDeadline': reminderOffset == 0,
                            'priority': priority == 'urgent' || priority == 'high' ? 'high' : 'normal',
                          }
                        : {'enabled': false, 'offsets': <int>[], 'notifyAtDeadline': false, 'priority': 'normal'},
                  ) ??
                  Task(
                    taskId: const Uuid().v4(),
                    title: trimmed,
                    description: description.text.trim(),
                    priority: priority,
                    categoryId: category,
                    deadline: deadline,
                    reminder: remindersOn
                        ? {
                            'enabled': true,
                            'offsets': reminderOffset == 0 ? <int>[] : <int>[reminderOffset],
                            'notifyAtDeadline': reminderOffset == 0,
                            'priority': priority == 'urgent' || priority == 'high' ? 'high' : 'normal',
                          }
                        : {'enabled': false, 'offsets': <int>[], 'notifyAtDeadline': false, 'priority': 'normal'},
                  );
              await ref.read(appControllerProvider.notifier).saveTask(task);
              if (dialogContext.mounted) Navigator.pop(dialogContext);
            },
            child: Text(existing == null ? 'Create' : 'Save'),
          ),
        ],
      ),
    ),
  );
}

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});
  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  DateTime month = DateTime(DateTime.now().year, DateTime.now().month);

  @override
  Widget build(BuildContext context) {
    final app = ref.watch(appControllerProvider);
    final first = DateTime(month.year, month.month, 1);
    final days = DateUtils.getDaysInMonth(month.year, month.month);
    final leading = first.weekday % 7;
    final cells = <DateTime?>[...List.filled(leading, null), ...List.generate(days, (index) => DateTime(month.year, month.month, index + 1))];
    while (cells.length % 7 != 0) {
      cells.add(null);
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
      children: [
        Row(
          children: [
            IconButton(onPressed: () => setState(() => month = DateTime(month.year, month.month - 1)), icon: const Icon(Icons.chevron_left)),
            Expanded(child: Text(DateFormat('MMMM yyyy').format(month), textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge)),
            IconButton(onPressed: () => setState(() => month = DateTime(month.year, month.month + 1)), icon: const Icon(Icons.chevron_right)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
              .map((day) => Expanded(child: Center(child: Text(day, style: TextStyle(color: Brand.softWhite.withOpacity(0.4), fontSize: 12)))))
              .toList(),
        ),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: cells.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, childAspectRatio: 0.8),
          itemBuilder: (context, index) {
            final date = cells[index];
            if (date == null) return const SizedBox.shrink();
            final dayTasks = app.tasks.where((task) => task.deadline != null && DateUtils.isSameDay(task.deadline, date)).toList();
            final isToday = DateUtils.isSameDay(date, DateTime.now());
            return Container(
              margin: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: isToday ? Brand.lavender.withOpacity(0.16) : Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(12),
                border: isToday ? Border.all(color: Brand.lavender.withOpacity(0.6)) : null,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('${date.day}', style: TextStyle(fontSize: 13, fontWeight: isToday ? FontWeight.w700 : FontWeight.w400)),
                  if (dayTasks.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: dayTasks.take(3).map((task) => Container(
                              width: 4,
                              height: 4,
                              margin: const EdgeInsets.symmetric(horizontal: 1),
                              decoration: BoxDecoration(color: priorityColor(task.priority), shape: BoxShape.circle),
                            )).toList(),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 18),
        const SectionTitle(title: 'Upcoming'),
        ...app.tasks.where((task) => !task.completed && task.deadline != null).take(12).map((task) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _TaskTile(task: task),
            )),
      ],
    );
  }
}

class FocusScreen extends ConsumerStatefulWidget {
  const FocusScreen({super.key});
  @override
  ConsumerState<FocusScreen> createState() => _FocusScreenState();
}

class _FocusScreenState extends ConsumerState<FocusScreen> {
  static const focusMinutes = 25;
  int remaining = focusMinutes * 60;
  bool running = false;
  Timer? timer;

  void start() {
    timer?.cancel();
    timer = Timer.periodic(const Duration(seconds: 1), (tick) {
      if (remaining <= 1) {
        tick.cancel();
        setState(() {
          running = false;
          remaining = 0;
        });
        ref.read(appControllerProvider.notifier).recordFocus(minutes: focusMinutes, completed: true);
        return;
      }
      setState(() => remaining -= 1);
    });
    setState(() => running = true);
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final minutes = (remaining ~/ 60).toString().padLeft(2, '0');
    final seconds = (remaining % 60).toString().padLeft(2, '0');
    final progress = 1 - (remaining / (focusMinutes * 60));

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: [
        const SizedBox(height: 20),
        Text('Focus mode', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 6),
        Text('One task. One moment. Total presence.', textAlign: TextAlign.center, style: TextStyle(color: Brand.softWhite.withOpacity(0.55))),
        const SizedBox(height: 28),
        Center(child: ProgressRing(value: progress, size: 240, label: 'Focus')),
        const SizedBox(height: 24),
        Center(child: Text('$minutes:$seconds', style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 52))),
        const SizedBox(height: 28),
        Row(
          children: [
            Expanded(
              child: PrimaryButton(
                label: running ? 'Pause' : 'Start focus',
                icon: running ? Icons.pause : Icons.play_arrow,
                onPressed: running
                    ? () {
                        timer?.cancel();
                        setState(() => running = false);
                      }
                    : start,
              ),
            ),
            const SizedBox(width: 12),
            IconButton.filledTonal(
              onPressed: () {
                timer?.cancel();
                setState(() {
                  running = false;
                  remaining = focusMinutes * 60;
                });
              },
              icon: const Icon(Icons.refresh),
            ),
          ],
        ),
        const SizedBox(height: 28),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('How focus works', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 8),
              Text('25 minutes of deep work, recorded to your shared history. Your streak and analytics update across every device.',
                  style: TextStyle(color: Brand.softWhite.withOpacity(0.6), height: 1.5)),
            ],
          ),
        ),
      ],
    );
  }
}

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final app = ref.watch(appControllerProvider);
    final completed = app.tasks.where((task) => task.completed).length;
    final pending = app.tasks.where((task) => !task.completed).length;
    final total = completed + pending;
    final now = DateTime.now();
    final week = List.generate(7, (index) => DateTime(now.year, now.month, now.day - (6 - index)));
    final weekData = week.map((day) => app.tasks.where((task) => task.completedAt != null && DateUtils.isSameDay(task.completedAt, day)).length.toDouble()).toList();
    final byCategory = <String, int>{};
    for (final task in app.tasks) {
      byCategory[task.categoryId] = (byCategory[task.categoryId] ?? 0) + 1;
    }

    return GradientBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Analytics')),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
          children: [
            GlassCard(
              child: Row(
                children: [
                  ProgressRing(value: total == 0 ? 0 : completed / total, size: 120, label: 'Completion'),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('$total tasks', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                        const SizedBox(height: 6),
                        Text('$completed completed', style: TextStyle(color: Brand.success.withOpacity(0.9))),
                        Text('$pending pending', style: TextStyle(color: Brand.warning.withOpacity(0.9))),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            const SectionTitle(title: 'Last 7 days'),
            GlassCard(
              child: SizedBox(
                height: 180,
                child: BarChart(
                  BarChartData(
                    gridData: const FlGridData(show: false),
                    borderData: FlBorderData(show: false),
                    titlesData: FlTitlesData(
                      leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          getTitlesWidget: (value, meta) {
                            final index = value.toInt();
                            if (index < 0 || index >= week.length) return const SizedBox.shrink();
                            return Text(DateFormat('E').format(week[index]), style: TextStyle(fontSize: 11, color: Brand.softWhite.withOpacity(0.5)));
                          },
                        ),
                      ),
                    ),
                    barGroups: List.generate(week.length, (index) => BarChartGroupData(x: index, barRods: [
                      BarChartRodData(toY: weekData[index], width: 14, borderRadius: BorderRadius.circular(6), color: Brand.lavender),
                    ])),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 18),
            const SectionTitle(title: 'By category'),
            ...byCategory.entries.map((entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GlassCard(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        Text(entry.key, style: const TextStyle(fontWeight: FontWeight.w600)),
                        const Spacer(),
                        Text('${entry.value}', style: TextStyle(color: Brand.softWhite.withOpacity(0.6))),
                      ],
                    ),
                  ),
                )),
          ],
        ),
      ),
    );
  }
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});
  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  late Future<List<Map<String, dynamic>>> future;

  @override
  void initState() {
    super.initState();
    future = ref.read(appControllerProvider.notifier).notifications();
  }

  @override
  Widget build(BuildContext context) {
    return GradientBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: const Text('Notifications'),
          actions: [
            TextButton(
              onPressed: () async {
                await ref.read(appControllerProvider.notifier).markNotificationsRead();
                setState(() => future = ref.read(appControllerProvider.notifier).notifications());
              },
              child: const Text('Mark all read'),
            ),
          ],
        ),
        body: FutureBuilder<List<Map<String, dynamic>>>(
          future: future,
          builder: (context, snapshot) {
            if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
            final items = snapshot.data!;
            if (items.isEmpty) return Center(child: Text('No notifications yet.', style: TextStyle(color: Brand.softWhite.withOpacity(0.5))));
            return ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                final read = item['read'] as bool? ?? false;
                final created = DateTime.fromMillisecondsSinceEpoch((item['createdAt'] as num).toInt());
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GestureDetector(
                    onTap: () async {
                      await ref.read(appControllerProvider.notifier).markNotificationsRead(id: item['id'] as String);
                      final taskId = item['taskId'] as String?;
                      if (context.mounted) {
                        if (taskId != null) context.go('/tasks?taskId=$taskId');
                        setState(() => future = ref.read(appControllerProvider.notifier).notifications());
                      }
                    },
                    child: GlassCard(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(read ? Icons.notifications_none : Icons.notifications_active, color: read ? Brand.softWhite.withOpacity(0.38) : Brand.lavender),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item['title'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                Text(item['body'] as String? ?? '', style: TextStyle(color: Brand.softWhite.withOpacity(0.6), fontSize: 13)),
                                const SizedBox(height: 6),
                                Text(DateFormat('MMM d, HH:mm').format(created), style: TextStyle(color: Brand.softWhite.withOpacity(0.4), fontSize: 11)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final app = ref.watch(appControllerProvider);
    final controller = ref.read(appControllerProvider.notifier);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
      children: [
        GlassCard(
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: const BoxDecoration(shape: BoxShape.circle, gradient: LinearGradient(colors: [Brand.lavender, Brand.violet])),
                child: const Center(child: Text('∞', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800))),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Your workspace', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    Text(app.identity?.workspaceId.substring(0, 8) ?? '—', style: TextStyle(color: Brand.softWhite.withOpacity(0.5), fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _menu(context, Icons.analytics_outlined, 'Analytics', '/analytics'),
        _menu(context, Icons.notifications_outlined, 'Notifications', '/notifications'),
        _menu(context, Icons.settings_outlined, 'Settings', '/settings'),
        const SizedBox(height: 16),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Pair another device', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Text('Generate a code and enter it on your other device.', style: TextStyle(color: Brand.softWhite.withOpacity(0.55), fontSize: 13)),
              const SizedBox(height: 12),
              PrimaryButton(
                label: 'Generate pairing code',
                icon: Icons.qr_code,
                onPressed: () async {
                  final code = await controller.pairingCode();
                  if (code != null && context.mounted) {
                    showDialog<void>(
                      context: context,
                      builder: (dialogContext) => AlertDialog(
                        backgroundColor: Brand.surface,
                        title: const Text('Pairing code'),
                        content: Text(code, style: const TextStyle(fontSize: 32, letterSpacing: 6, fontWeight: FontWeight.w800)),
                        actions: [TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Done'))],
                      ),
                    );
                  }
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        TextButton.icon(
          onPressed: () async {
            await controller.signOut();
            if (context.mounted) context.go('/onboarding');
          },
          icon: const Icon(Icons.logout, color: Brand.danger),
          label: const Text('Sign out of this device', style: TextStyle(color: Brand.danger)),
        ),
      ],
    );
  }

  Widget _menu(BuildContext context, IconData icon, String label, String route) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: EdgeInsets.zero,
        child: ListTile(
          leading: Icon(icon, color: Brand.lavender),
          title: Text(label),
          trailing: Icon(Icons.chevron_right, color: Brand.softWhite.withOpacity(0.38)),
          onTap: () => context.push(route),
        ),
      ),
    );
  }
}

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final app = ref.watch(appControllerProvider);
    final controller = ref.read(appControllerProvider.notifier);
    final prefs = app.preferences;
    bool value(String key, bool fallback) => prefs[key] as bool? ?? fallback;

    return GradientBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Settings')),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
          children: [
            GlassCard(
              child: Column(
                children: [
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Push notifications'),
                    subtitle: const Text('Master switch for all reminders'),
                    value: value('pushEnabled', true),
                    onChanged: (enabled) => controller.updatePreferences({'pushEnabled': enabled}),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Task reminders'),
                    value: value('taskReminders', true),
                    onChanged: (enabled) => controller.updatePreferences({'taskReminders': enabled}),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Deadline alerts'),
                    value: value('deadlineAlerts', true),
                    onChanged: (enabled) => controller.updatePreferences({'deadlineAlerts': enabled}),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Daily motivation'),
                    value: value('dailyMotivation', false),
                    onChanged: (enabled) => controller.updatePreferences({'dailyMotivation': enabled}),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Quiet hours'),
                    value: value('quietHoursEnabled', false),
                    onChanged: (enabled) => controller.updatePreferences({'quietHoursEnabled': enabled}),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            PrimaryButton(
              label: 'Send test notification',
              icon: Icons.notifications_active,
              onPressed: () async {
                final error = await controller.sendTestNotification();
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(error == null ? 'Test notification sent.' : error)),
                );
              },
            ),
            const SizedBox(height: 16),
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('About ANAṆTHA', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text('Plan. Progress. Become Infinite.\nShared backend, real reminders, every device.',
                      style: TextStyle(color: Brand.softWhite.withOpacity(0.55), height: 1.5, fontSize: 13)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
