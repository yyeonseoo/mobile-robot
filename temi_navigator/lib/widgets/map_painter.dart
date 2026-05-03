// lib/widgets/map_painter.dart

import 'dart:math';
import 'package:flutter/material.dart';
import '../models/position.dart';

class MapPainter extends CustomPainter {
  final TemiPosition? temiPosition;
  final List<StampSpot> spots;

  // 나중에 실제 맵 범위로 교체 (Temi SLAM 맵 기준)
  static const double mapRangeX = 10.0;
  static const double mapRangeY = 10.0;

  MapPainter({this.temiPosition, required this.spots});

  @override
  void paint(Canvas canvas, Size size) {
    _drawGrid(canvas, size);
    _drawSpots(canvas, size);
    _drawTemi(canvas, size);
  }

  // 격자 배경 (나중에 맵 이미지로 교체)
  void _drawGrid(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.05)
      ..strokeWidth = 1.0;

    const int gridCount = 20;
    for (int i = 0; i <= gridCount; i++) {
      final x = size.width * i / gridCount;
      final y = size.height * i / gridCount;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  // 스탬프 스팟 그리기
  void _drawSpots(Canvas canvas, Size size) {
    for (final spot in spots) {
      final offset = _toCanvas(spot.x, spot.y, size);

      // 획득 여부에 따라 색상 변경
      final color = spot.acquired
          ? const Color(0xFFFFD700)   // 골드 (획득)
          : const Color(0xFF4A90E2);  // 파란색 (미획득)

      // 외곽 링 (포켓몬 GO 스타일)
      canvas.drawCircle(
        offset,
        18,
        Paint()
          ..color = color.withOpacity(0.3)
          ..style = PaintingStyle.fill,
      );
      canvas.drawCircle(
        offset,
        14,
        Paint()
          ..color = color
          ..style = PaintingStyle.fill,
      );

      // 스팟 아이콘 (체크 or 별)
      final icon = spot.acquired ? '✓' : '★';
      final tp = TextPainter(
        text: TextSpan(
          text: icon,
          style: TextStyle(
            color: Colors.white,
            fontSize: spot.acquired ? 12 : 10,
            fontWeight: FontWeight.bold,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(
        canvas,
        offset - Offset(tp.width / 2, tp.height / 2),
      );

      // 스팟 이름 라벨
      final label = TextPainter(
        text: TextSpan(
          text: spot.name,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 9,
            shadows: [Shadow(color: Colors.black, blurRadius: 4)],
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      label.paint(
        canvas,
        offset + Offset(-label.width / 2, 18),
      );
    }
  }

  // Temi 로봇 그리기
  void _drawTemi(Canvas canvas, Size size) {
    if (temiPosition == null) return;

    final offset = _toCanvas(temiPosition!.x, temiPosition!.y, size);
    final yaw = temiPosition!.yaw;

    // 방향 표시 삼각형
    final arrowPaint = Paint()
      ..color = const Color(0xFF00E5FF)
      ..style = PaintingStyle.fill;

    final path = Path();
    final tipX = offset.dx + cos(yaw) * 22;
    final tipY = offset.dy - sin(yaw) * 22;
    path.moveTo(tipX, tipY);
    path.lineTo(
      offset.dx + cos(yaw + pi * 0.8) * 14,
      offset.dy - sin(yaw + pi * 0.8) * 14,
    );
    path.lineTo(
      offset.dx + cos(yaw - pi * 0.8) * 14,
      offset.dy - sin(yaw - pi * 0.8) * 14,
    );
    path.close();
    canvas.drawPath(path, arrowPaint);

    // 외곽 링 (펄스 효과는 애니메이션으로)
    canvas.drawCircle(
      offset,
      20,
      Paint()
        ..color = const Color(0xFF00E5FF).withOpacity(0.2)
        ..style = PaintingStyle.fill,
    );

    // 본체 원
    canvas.drawCircle(
      offset,
      14,
      Paint()
        ..color = const Color(0xFF00E5FF)
        ..style = PaintingStyle.fill,
    );

    // 'T' 텍스트
    final tp = TextPainter(
      text: const TextSpan(
        text: 'T',
        style: TextStyle(
          color: Colors.black,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, offset - Offset(tp.width / 2, tp.height / 2));
  }

  // Temi 좌표 → 캔버스 픽셀 변환
  Offset _toCanvas(double x, double y, Size size) {
    final px = (x / mapRangeX) * size.width;
    final py = size.height - (y / mapRangeY) * size.height;
    return Offset(px.clamp(10, size.width - 10), py.clamp(10, size.height - 10));
  }

  @override
  bool shouldRepaint(MapPainter oldDelegate) =>
      oldDelegate.temiPosition != temiPosition || oldDelegate.spots != spots;
}
