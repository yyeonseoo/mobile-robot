// lib/screens/map_screen.dart

import 'package:flutter/material.dart';
import '../models/position.dart';
import '../services/socket_service.dart';
import '../services/api_service.dart';
import '../widgets/map_painter.dart';

class MapScreen extends StatefulWidget {
  final String userId;
  const MapScreen({super.key, required this.userId});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen>
    with SingleTickerProviderStateMixin {
  final SocketService _socketService = SocketService();

  TemiPosition? _temiPosition;
  List<StampSpot> _spots = [];
  bool _isLoading = true;

  // 펄스 애니메이션 (Temi 위치 표시용)
  late AnimationController _pulseController;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _setupAnimation();
    _init();
  }

  void _setupAnimation() {
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _pulseAnim = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  Future<void> _init() async {
    // 스팟 목록 로드
    final spots = await ApiService.getSpots(widget.userId);
    setState(() {
      _spots = spots;
      _isLoading = false;
    });

    // 소켓 연결 및 콜백 등록
    _socketService.onTemiPosition = (data) {
      setState(() {
        _temiPosition = TemiPosition.fromJson(data);
      });
    };

    _socketService.onStampUpdated = (data) {
      final stampId = data['stamp_id'];
      setState(() {
        final idx = _spots.indexWhere((s) => s.spotId == stampId);
        if (idx != -1) _spots[idx].acquired = true;
      });
      _showStampNotification(_spots.firstWhere(
        (s) => s.spotId == stampId,
        orElse: () => StampSpot(
          spotId: stampId,
          markerId: 0,
          name: '스팟',
          x: 0,
          y: 0,
        ),
      ));
    };

    _socketService.connect(widget.userId);
  }

  void _showStampNotification(StampSpot spot) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Text('⭐', style: TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Text(
              '${spot.name} 스탬프 획득!',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF1A1A2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  int get _acquiredCount => _spots.where((s) => s.acquired).length;

  @override
  void dispose() {
    _pulseController.dispose();
    _socketService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(child: _buildMapArea()),
            _buildStampBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'TEMI NAVIGATOR',
            style: TextStyle(
              color: Color(0xFF00E5FF),
              fontSize: 18,
              fontWeight: FontWeight.w900,
              letterSpacing: 3,
            ),
          ),
          // 연결 상태 표시
          AnimatedBuilder(
            animation: _socketService,
            builder: (context, _) {
              return Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _socketService.isConnected
                          ? const Color(0xFF00FF88)
                          : Colors.red,
                      boxShadow: [
                        BoxShadow(
                          color: _socketService.isConnected
                              ? const Color(0xFF00FF88)
                              : Colors.red,
                          blurRadius: 6,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _socketService.isConnected ? 'CONNECTED' : 'OFFLINE',
                    style: TextStyle(
                      color: _socketService.isConnected
                          ? const Color(0xFF00FF88)
                          : Colors.red,
                      fontSize: 11,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMapArea() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF00E5FF).withOpacity(0.3),
          width: 1,
        ),
        // ── 나중에 맵 이미지로 교체 ──
        // image: DecorationImage(
        //   image: AssetImage('assets/classroom_map.png'),
        //   fit: BoxFit.contain,
        // ),
        color: const Color(0xFF0A1628),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            // 맵 배경 (임시 격자)
            Positioned.fill(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFF00E5FF),
                      ),
                    )
                  : AnimatedBuilder(
                      animation: _pulseAnim,
                      builder: (context, child) {
                        return CustomPaint(
                          painter: MapPainter(
                            temiPosition: _temiPosition,
                            spots: _spots,
                          ),
                          child: Container(),
                        );
                      },
                    ),
            ),

            // Temi 없을 때 안내 메시지
            if (_temiPosition == null && !_isLoading)
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.smart_toy_outlined,
                      color: Colors.white.withOpacity(0.2),
                      size: 48,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Temi 연결 대기중...',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.3),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),

            // 좌측 하단 범례
            Positioned(
              left: 12,
              bottom: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _legendItem(const Color(0xFF00E5FF), 'Temi 로봇'),
                  const SizedBox(height: 4),
                  _legendItem(const Color(0xFF4A90E2), '미방문 스팟'),
                  const SizedBox(height: 4),
                  _legendItem(const Color(0xFFFFD700), '완료 스팟'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _legendItem(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  Widget _buildStampBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '스탬프  $_acquiredCount / ${_spots.length}',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                  letterSpacing: 1,
                ),
              ),
              if (_acquiredCount == _spots.length && _spots.isNotEmpty)
                const Text(
                  '🎉 완주!',
                  style: TextStyle(
                    color: Color(0xFFFFD700),
                    fontWeight: FontWeight.bold,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          // 스탬프 아이콘 목록
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _spots.map((spot) {
                return Container(
                  margin: const EdgeInsets.only(right: 8),
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: spot.acquired
                        ? const Color(0xFFFFD700)
                        : const Color(0xFF1E2A3A),
                    border: Border.all(
                      color: spot.acquired
                          ? const Color(0xFFFFD700)
                          : Colors.white24,
                      width: 2,
                    ),
                    boxShadow: spot.acquired
                        ? [
                            const BoxShadow(
                              color: Color(0xFFFFD700),
                              blurRadius: 8,
                              spreadRadius: 1,
                            )
                          ]
                        : null,
                  ),
                  child: Center(
                    child: Text(
                      spot.acquired ? '★' : '${spot.spotId}',
                      style: TextStyle(
                        color: spot.acquired ? Colors.black : Colors.white38,
                        fontSize: spot.acquired ? 16 : 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
