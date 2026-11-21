import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class Brand {
  static const midnight = Color(0xFF0F0F1E);
  static const deep = Color(0xFF1A1A2E);
  static const surface = Color(0xFF191429);
  static const lavender = Color(0xFF9D88FF);
  static const lavenderSoft = Color(0xFFB8A8FF);
  static const violet = Color(0xFF7D5FFF);
  static const softWhite = Color(0xFFF8F7FF);
  static const success = Color(0xFF51CF66);
  static const warning = Color(0xFFFFC078);
  static const danger = Color(0xFFFF6B6B);
}

ThemeData buildTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  final scheme = ColorScheme.fromSeed(
    seedColor: Brand.lavender,
    brightness: Brightness.dark,
  ).copyWith(
    primary: Brand.lavender,
    onPrimary: Brand.midnight,
    secondary: Brand.violet,
    onSecondary: Brand.softWhite,
    surface: Brand.surface,
    onSurface: Brand.softWhite,
    onSurfaceVariant: Brand.softWhite.withOpacity(0.72),
    error: Brand.danger,
    onError: Brand.softWhite,
  );

  final text = GoogleFonts.manropeTextTheme(base.textTheme).apply(
    bodyColor: Brand.softWhite,
    displayColor: Brand.softWhite,
  );

  return base.copyWith(
    colorScheme: scheme,
    scaffoldBackgroundColor: Brand.midnight,
    textTheme: text.copyWith(
      displayLarge: GoogleFonts.manrope(
        fontSize: 44,
        fontWeight: FontWeight.w800,
        letterSpacing: -1,
        color: Brand.softWhite,
      ),
      headlineMedium: GoogleFonts.manrope(
        fontSize: 26,
        fontWeight: FontWeight.w700,
        color: Brand.softWhite,
      ),
      titleLarge: GoogleFonts.manrope(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: Brand.softWhite,
      ),
      bodyLarge: GoogleFonts.inter(fontSize: 16, height: 1.5, color: Brand.softWhite),
      bodyMedium: GoogleFonts.inter(fontSize: 14, height: 1.5, color: Brand.softWhite),
      labelLarge: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: Brand.softWhite,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: Brand.softWhite),
      iconTheme: const IconThemeData(color: Brand.softWhite),
    ),
    cardTheme: CardThemeData(
      color: Colors.white.withOpacity(0.06),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      margin: EdgeInsets.zero,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white.withOpacity(0.06),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Brand.lavender, width: 1.4),
      ),
      hintStyle: TextStyle(color: Brand.softWhite.withOpacity(0.45)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Brand.deep.withOpacity(0.92),
      indicatorColor: Brand.lavender.withOpacity(0.22),
      labelTextStyle: WidgetStatePropertyAll(GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
      iconTheme: const WidgetStatePropertyAll(IconThemeData(color: Brand.softWhite)),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: Brand.surface,
      contentTextStyle: const TextStyle(color: Brand.softWhite),
      behavior: SnackBarBehavior.floating,
    ),
    dividerColor: Colors.white.withOpacity(0.08),
  );
}

class GradientBackground extends StatelessWidget {
  const GradientBackground({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF15102A), Brand.midnight, Color(0xFF0A0A14)],
          stops: [0, 0.45, 1],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -120,
            right: -80,
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [Brand.violet.withOpacity(0.35), Colors.transparent]),
              ),
            ),
          ),
          Positioned(
            bottom: -160,
            left: -100,
            child: Container(
              width: 360,
              height: 360,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [Brand.lavender.withOpacity(0.16), Colors.transparent]),
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}

class GlassCard extends StatelessWidget {
  const GlassCard({super.key, required this.child, this.padding = const EdgeInsets.all(20)});
  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.055),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        boxShadow: [
          BoxShadow(color: Brand.violet.withOpacity(0.08), blurRadius: 30, offset: const Offset(0, 12)),
        ],
      ),
      child: child,
    );
  }
}

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({super.key, required this.label, this.onPressed, this.icon, this.busy = false});
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(colors: [Brand.lavender, Brand.violet]),
        boxShadow: [BoxShadow(color: Brand.violet.withOpacity(0.35), blurRadius: 24, offset: const Offset(0, 10))],
      ),
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Brand.midnight,
          disabledBackgroundColor: Colors.transparent,
          disabledForegroundColor: Brand.midnight.withOpacity(0.45),
          shadowColor: Colors.transparent,
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
        onPressed: busy ? null : onPressed,
        icon: busy
            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Brand.softWhite))
            : (icon == null ? const SizedBox.shrink() : Icon(icon, size: 20)),
        label: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle({super.key, required this.title, this.action});
  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const Spacer(),
          if (action != null) action!,
        ],
      ),
    );
  }
}

class ProgressRing extends StatelessWidget {
  const ProgressRing({super.key, required this.value, this.size = 150, this.label = 'Daily progress'});
  final double value;
  final double size;
  final String label;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: value.clamp(0, 1)),
            duration: const Duration(milliseconds: 900),
            curve: Curves.easeOutCubic,
            builder: (context, animated, _) => CustomPaint(
              size: Size.square(size),
              painter: _RingPainter(animated),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('${(value * 100).round()}%', style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 34)),
              Text(label, style: TextStyle(color: Brand.softWhite.withOpacity(0.55), fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.value);
  final double value;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 12
      ..color = Colors.white.withOpacity(0.07);
    canvas.drawArc(rect.deflate(6), 0, 6.28318, false, track);

    final glow = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 16
      ..strokeCap = StrokeCap.round
      ..color = Brand.lavender.withOpacity(0.18)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10);
    canvas.drawArc(rect.deflate(6), -1.5708, 6.28318 * value, false, glow);

    final progress = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round
      ..shader = const SweepGradient(colors: [Brand.lavenderSoft, Brand.violet]).createShader(rect);
    canvas.drawArc(rect.deflate(6), -1.5708, 6.28318 * value, false, progress);
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) => oldDelegate.value != value;
}

String greeting() {
  final hour = DateTime.now().hour;
  if (hour < 5) return 'Still becoming';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

const motivation = [
  'Small steps create extraordinary results.',
  'One focused hour can change your whole day.',
  'Your future self is cheering you on.',
  'Progress, not perfection. Keep moving.',
  'Today is a beautiful day to become infinite.',
];
