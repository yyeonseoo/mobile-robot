// lib/main.dart

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:math';
import 'screens/map_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const TemiNavigatorApp());
}

class TemiNavigatorApp extends StatelessWidget {
  const TemiNavigatorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Temi Navigator',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0D1117),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00E5FF),
          secondary: Color(0xFFFFD700),
        ),
      ),
      home: const SplashScreen(),
    );
  }
}

// ── 스플래시 & 사용자 등록 ──────────────────────────
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeIn);
    _animController.forward();
    _initUser();
  }

  Future<void> _initUser() async {
    final prefs = await SharedPreferences.getInstance();
    String? userId = prefs.getString('user_id');

    if (userId == null) {
      // 새 사용자 ID 생성 (랜덤)
      userId = 'user_${Random().nextInt(99999).toString().padLeft(5, '0')}';
      await prefs.setString('user_id', userId);
      await ApiService.registerUser(userId);
    }

    await Future.delayed(const Duration(milliseconds: 1800));

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => MapScreen(userId: userId!),
        ),
      );
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      body: FadeTransition(
        opacity: _fadeAnim,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 로봇 아이콘
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0xFF00E5FF),
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF00E5FF).withOpacity(0.3),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.smart_toy_rounded,
                  color: Color(0xFF00E5FF),
                  size: 52,
                ),
              ),
              const SizedBox(height: 28),
              const Text(
                'TEMI',
                style: TextStyle(
                  color: Color(0xFF00E5FF),
                  fontSize: 36,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 8,
                ),
              ),
              const Text(
                'NAVIGATOR',
                style: TextStyle(
                  color: Colors.white38,
                  fontSize: 14,
                  letterSpacing: 6,
                ),
              ),
              const SizedBox(height: 48),
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: Color(0xFF00E5FF),
                  strokeWidth: 2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
