// lib/services/api_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/position.dart';

class ApiService {
  // ──────────────────────────────────────────────
  // 소켓 서버와 같은 주소 사용
  static const String _baseUrl = 'http://YOUR_SERVER_IP:3000/api';
  // ──────────────────────────────────────────────

  /// 사용자 등록 (최초 1회)
  static Future<bool> registerUser(String userId) async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/user/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'user_id': userId}),
      );
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  /// 스탬프 스팟 목록 가져오기
  static Future<List<StampSpot>> getSpots(String userId) async {
    try {
      final spotsRes = await http.get(Uri.parse('$_baseUrl/map/spots'));
      final stampsRes = await http.get(
        Uri.parse('$_baseUrl/user/$userId/stamps'),
      );

      if (spotsRes.statusCode != 200) return [];

      final spotsData = jsonDecode(spotsRes.body)['spots'] as List;
      final List<StampSpot> spots =
          spotsData.map((s) => StampSpot.fromJson(s)).toList();

      // 획득 여부 반영
      if (stampsRes.statusCode == 200) {
        final stampsData = jsonDecode(stampsRes.body)['stamps'] as List;
        for (var stamp in stampsData) {
          if (stamp['acquired'] == true) {
            final idx = spots.indexWhere(
              (s) => s.spotId == stamp['stamp_id'],
            );
            if (idx != -1) spots[idx].acquired = true;
          }
        }
      }

      return spots;
    } catch (e) {
      return [];
    }
  }

  /// Temi에게 이동 명령
  static Future<bool> sendGotoCommand(int spotId) async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/temi/goto'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'spot_id': spotId}),
      );
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
