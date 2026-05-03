// lib/models/position.dart

import 'dart:ui';

class TemiPosition {
  final double x;
  final double y;
  final double yaw;

  TemiPosition({required this.x, required this.y, required this.yaw});

  factory TemiPosition.fromJson(Map<String, dynamic> json) {
    return TemiPosition(
      x: (json['x'] ?? 0).toDouble(),
      y: (json['y'] ?? 0).toDouble(),
      yaw: (json['yaw'] ?? 0).toDouble(),
    );
  }

  /// Temi 미터 좌표 → 캔버스 픽셀 좌표 변환
  /// mapWidth, mapHeight: 캔버스 크기
  /// mapRangeX, mapRangeY: Temi 맵 실제 범위 (미터 단위, 나중에 맞춰야 함)
  Offset toCanvasOffset(
    double canvasWidth,
    double canvasHeight, {
    double mapRangeX = 10.0,
    double mapRangeY = 10.0,
    double originX = 0.0,
    double originY = 0.0,
  }) {
    final px = ((x - originX) / mapRangeX) * canvasWidth;
    final py = canvasHeight - ((y - originY) / mapRangeY) * canvasHeight;
    return Offset(px, py);
  }
}

class StampSpot {
  final int spotId;
  final int markerId;
  final String name;
  final double x;
  final double y;
  bool acquired;

  StampSpot({
    required this.spotId,
    required this.markerId,
    required this.name,
    required this.x,
    required this.y,
    this.acquired = false,
  });

  factory StampSpot.fromJson(Map<String, dynamic> json) {
    return StampSpot(
      spotId: json['spot_id'],
      markerId: json['marker_id'],
      name: json['name'],
      x: (json['x'] ?? 0).toDouble(),
      y: (json['y'] ?? 0).toDouble(),
      acquired: json['acquired'] ?? false,
    );
  }
}


