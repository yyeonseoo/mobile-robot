package com.example.test;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import org.json.JSONObject;

import java.net.URISyntaxException;

import io.socket.client.IO;
import io.socket.client.Socket;

public class SocketService {

    public interface CommandListener {
        void onGotoRequested(String locationId);
        void onStopRequested();
        void onPhotoBoothRequested();
    }

    private static final String TAG = "SocketService";

    private final String serverUrl;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Socket socket;
    private CommandListener commandListener;

    public SocketService(String serverUrl) {
        this.serverUrl = serverUrl;
    }

    public void setCommandListener(CommandListener commandListener) {
        this.commandListener = commandListener;
    }

    public void connect() {
        if (socket != null) {
            if (!socket.connected()) {
                socket.connect();
            }
            return;
        }

        try {
            IO.Options options = new IO.Options();
            options.reconnection = true;
            options.reconnectionAttempts = Integer.MAX_VALUE;
            options.reconnectionDelay = 1000;
            options.timeout = 5000;
            options.query = "room=temi";
            options.forceNew = true;

            socket = IO.socket(serverUrl, options);

            socket.on(Socket.EVENT_CONNECT, args ->
                    Log.d(TAG, "Socket connected: " + serverUrl)
            );

            socket.on(Socket.EVENT_DISCONNECT, args ->
                    Log.d(TAG, "Socket disconnected")
            );

            socket.on(Socket.EVENT_CONNECT_ERROR, args ->
                    Log.e(TAG, "Socket connect error: " + (args.length > 0 ? args[0] : "unknown"))
            );

            socket.on("temi:goto", args -> {
                String locationId = parseLocationId(args);
                Log.d(TAG, "Command received temi:goto -> " + locationId);

                if (locationId.isEmpty()) {
                    return;
                }

                CommandListener listener = commandListener;
                if (listener != null) {
                    mainHandler.post(() -> listener.onGotoRequested(locationId));
                }
            });

            socket.on("temi:stop", args -> {
                Log.d(TAG, "Command received temi:stop");

                CommandListener listener = commandListener;
                if (listener != null) {
                    mainHandler.post(listener::onStopRequested);
                }
            });

            socket.on("temi:photo_booth_start", args -> {
                Log.d(TAG, "Command received temi:photo_booth_start");

                CommandListener listener = commandListener;
                if (listener != null) {
                    mainHandler.post(listener::onPhotoBoothRequested);
                }
            });

            socket.connect();

        } catch (URISyntaxException e) {
            Log.e(TAG, "Socket URL error: " + serverUrl, e);
        }
    }

    private String parseLocationId(Object[] args) {
        if (args == null || args.length == 0 || args[0] == null) {
            return "";
        }

        Object first = args[0];

        try {
            if (first instanceof JSONObject) {
                JSONObject json = (JSONObject) first;

                String locationId = json.optString("locationId", "").trim();
                if (!locationId.isEmpty()) {
                    return locationId;
                }

                String target = json.optString("target", "").trim();
                if (!target.isEmpty()) {
                    return target;
                }

                String destination = json.optString("destination", "").trim();
                if (!destination.isEmpty()) {
                    return destination;
                }

                return "";
            }

            return String.valueOf(first).trim();
        } catch (Exception e) {
            Log.e(TAG, "parseLocationId failed", e);
            return "";
        }
    }

    public void disconnect() {
        if (socket == null) {
            return;
        }

        socket.disconnect();
        socket.off();
        socket = null;
    }

    public boolean isConnected() {
        return socket != null && socket.connected();
    }

    public void emitPosition(float x, float y, float yaw, String locationId, String navState) {
        if (socket == null || !socket.connected()) {
            Log.d(TAG, "emitPosition skipped. socket not connected.");
            return;
        }

        try {
            JSONObject payload = new JSONObject();
            payload.put("x", x);
            payload.put("y", y);
            payload.put("yaw", yaw);
            payload.put("locationId", locationId == null ? "" : locationId);
            payload.put("navState", navState == null ? "" : navState);
            payload.put("timestamp", System.currentTimeMillis());

            socket.emit("temi:position", payload);
            Log.d(TAG, "emitPosition: " + payload);

        } catch (Exception e) {
            Log.e(TAG, "emitPosition failed", e);
        }
    }
}
