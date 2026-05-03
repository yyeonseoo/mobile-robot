// lib/services/socket_service.dart

import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';

class SocketService extends ChangeNotifier {
  IO.Socket? _socket;
  bool _isConnected = false;

  // ──────────────────────────────────────────────
  // 서버 주소 여기서 변경! (팀원 노트북 IP)
  // 예: 'http://192.168.0.100:3000'
  static const String _serverUrl = 'http://YOUR_SERVER_IP:3000';
  // ──────────────────────────────────────────────

  bool get isConnected => _isConnected;

  // 외부에서 등록할 콜백
  Function(Map<String, dynamic>)? onTemiPosition;
  Function(Map<String, dynamic>)? onStampUpdated;

  void connect(String userId) {
    _socket = IO.io(
      _serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setQuery({'user_id': userId, 'room': 'app'})
          .build(),
    );

    _socket!.connect();

    // 연결 성공
    _socket!.onConnect((_) {
      _isConnected = true;
      debugPrint('[Socket] 서버 연결 성공');
      notifyListeners();
    });

    // 연결 해제
    _socket!.onDisconnect((_) {
      _isConnected = false;
      debugPrint('[Socket] 서버 연결 해제');
      notifyListeners();
    });

    // 연결 오류
    _socket!.onConnectError((err) {
      debugPrint('[Socket] 연결 오류: $err');
    });

    // ── Temi 위치 수신 ──
    _socket!.on('app:temi_position', (data) {
      if (onTemiPosition != null) {
        onTemiPosition!(Map<String, dynamic>.from(data));
      }
    });

    // ── 스탬프 업데이트 수신 ──
    _socket!.on('app:stamp_updated', (data) {
      if (onStampUpdated != null) {
        onStampUpdated!(Map<String, dynamic>.from(data));
      }
      notifyListeners();
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}
