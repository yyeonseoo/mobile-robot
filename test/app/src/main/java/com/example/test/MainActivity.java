package com.example.test;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.graphics.ImageFormat;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureFailure;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.media.Image;
import android.media.ImageReader;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import android.util.Base64;
import android.util.Size;
import android.view.Surface;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.robotemi.sdk.Robot;
import com.robotemi.sdk.TtsRequest;
import com.robotemi.sdk.listeners.OnGoToLocationStatusChangedListener;
import com.robotemi.sdk.listeners.OnRobotReadyListener;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class MainActivity extends AppCompatActivity implements
        OnRobotReadyListener,
        OnGoToLocationStatusChangedListener {

    private Robot robot;
    private WebView webView;
    private SocketService socketService;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private String navState = "idle";
    private String lastLocationId = "";

    private static final int REQUEST_CAMERA_PERMISSION = 2002;

    private HandlerThread cameraThread;
    private Handler cameraHandler;
    private CameraDevice nativeCameraDevice;
    private CameraCaptureSession nativeCaptureSession;
    private ImageReader nativeImageReader;

    private boolean nativeCameraStarting = false;
    private boolean nativeCameraPreviewRunning = false;
    private boolean nativePhotoBusy = false;
    private boolean nativePhotoRequested = false;
    private boolean pendingNativePhotoAfterPermission = false;
    private boolean pendingNativePreviewAfterPermission = false;

    private long lastPreviewEmitMs = 0L;

    // 서버 노트북에서 ipconfig 했을 때 나오는 Wi-Fi IPv4 주소.
    // Temi IP가 아니라 서버 노트북 IP임.
    private static final String SERVER_HOST = "172.100.6.27";

    // Temi WebView가 받아올 화면 UI 서버
    private static final String TEMI_UI_URL = "http://" + SERVER_HOST + ":8080/temi/index.html";

    // Temi 위치를 모바일 UI로 중계할 Socket.IO 서버
    private static final String SOCKET_URL = "http://" + SERVER_HOST + ":3000";

    // 모바일 인생네컷 명령을 받았을 때 Temi WebView에서 열 포토부스 페이지
    private static final String PHOTO_CAPTURE_URL = "http://" + SERVER_HOST + ":8080/temi/photo-capture.html";

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        robot = Robot.getInstance();

        socketService = new SocketService(SOCKET_URL);
        socketService.setCommandListener(new SocketService.CommandListener() {
            @Override
            public void onGotoRequested(String locationId) {
                String target = normalizeTemiLocationName(locationId);
                toast("모바일 길안내 요청: " + target);
                goToLocation(target);
            }

            @Override
            public void onStopRequested() {
                toast("모바일 정지 요청");
                stopTemi();
            }

            @Override
            public void onPhotoBoothRequested() {
                toast("모바일 인생네컷 요청");
                startPhotoBoothFromMobile();
            }
        });
        socketService.connect();

        // Socket.IO 연결은 비동기라서 앱 시작 직후 테스트 신호를 보낸다.
        mainHandler.postDelayed(() -> emitSocketPosition("app_start", "starting"), 1000);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        webView.setWebChromeClient(new WebChromeClient());

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);

                injectTemiBridge();
                toast("Temi UI 로드 완료");
            }
        });

        // 웹에서는 window.TemiBridge.* 로 호출하고,
        // Android WebView 내부에서는 window.TemiNative.* 로 실제 Java 함수에 연결한다.
        webView.addJavascriptInterface(new TemiNativeBridge(), "TemiNative");

        webView.loadUrl(TEMI_UI_URL);
    }

    @Override
    protected void onStart() {
        super.onStart();

        robot.addOnRobotReadyListener(this);
        robot.addOnGoToLocationStatusChangedListener(this);

        if (socketService != null) {
            socketService.connect();
        }
    }

    @Override
    protected void onStop() {
        try {
            robot.stopMovement();
        } catch (Exception ignored) {
        }

        closeNativeCamera();
        stopCameraThread();

        if (socketService != null) {
            socketService.disconnect();
        }

        robot.removeOnRobotReadyListener(this);
        robot.removeOnGoToLocationStatusChangedListener(this);

        super.onStop();
    }

    @Override
    public void onRobotReady(boolean isReady) {
        if (!isReady) {
            navState = "error";
            emitNavToWeb("error", "", "Temi SDK not ready");
            return;
        }

        try {
            ActivityInfo activityInfo = getPackageManager()
                    .getActivityInfo(getComponentName(), PackageManager.GET_META_DATA);

            robot.onStart(activityInfo);

            navState = "idle";
            emitNavToWeb("idle", "", "Temi SDK ready");
            toast("Temi SDK 연결 완료");
            emitSocketPosition("ready", "idle");

        } catch (PackageManager.NameNotFoundException e) {
            navState = "error";
            emitNavToWeb("error", "", "ActivityInfo 오류: " + e.getMessage());
            toast("ActivityInfo 오류: " + e.getMessage());
        }
    }

    @Override
    public void onGoToLocationStatusChanged(
            String location,
            String status,
            int descriptionId,
            String description
    ) {
        lastLocationId = normalizeTemiLocationName(location == null ? "" : location);

        if (OnGoToLocationStatusChangedListener.COMPLETE.equals(status)) {
            navState = "arrived";
            emitNavToWeb("arrived", lastLocationId, "도착 완료");
            emitSocketPosition(lastLocationId, navState);
            speak("도착했습니다.");
            return;
        }

        if (OnGoToLocationStatusChangedListener.ABORT.equals(status)) {
            navState = "error";
            emitNavToWeb("error", lastLocationId, "이동 중단: " + description);
            emitSocketPosition(lastLocationId, navState);
            speak("이동이 중단되었습니다.");
            return;
        }

        navState = "moving";
        emitNavToWeb("moving", lastLocationId, status + " / " + description);
        emitSocketPosition(lastLocationId, navState);
    }

    private void goToLocation(String locationName) {
        String rawTarget = locationName == null ? "" : locationName.trim();
        String normalizedTarget = normalizeTemiLocationName(rawTarget);

        if (normalizedTarget.isEmpty()) {
            navState = "error";
            emitNavToWeb("error", "", "빈 위치명");
            toast("빈 위치명입니다.");
            return;
        }

        List<String> locations = robot.getLocations();

        String target = resolveSavedTemiLocation(normalizedTarget, locations);

        if (locations == null || target == null || !locations.contains(target)) {
            navState = "error";

            String msg = "저장된 위치에 없음: "
                    + rawTarget
                    + " → 변환값: "
                    + normalizedTarget
                    + " / 현재 위치 목록: "
                    + locations;

            emitNavToWeb("error", normalizedTarget, msg);
            speak(rawTarget + " 위치가 없습니다.");
            toast(msg);
            return;
        }

        lastLocationId = normalizeTemiLocationName(target);
        navState = "moving";

        robot.goTo(target);

        emitNavToWeb("moving", lastLocationId, "이동 시작: " + rawTarget + " → " + target);
        emitSocketPosition(lastLocationId, navState);
        toast("이동 시작: " + rawTarget + " → " + target);
    }

    // 실제 Temi Map Editor에 저장된 이름을 찾는다.
    // 핵심 수정: homebase / home base / home_base 혼동 방지.
    private String resolveSavedTemiLocation(String normalizedTarget, List<String> locations) {
        if (normalizedTarget == null || normalizedTarget.trim().isEmpty() || locations == null) {
            return null;
        }

        String target = normalizedTarget.trim();

        if (locations.contains(target)) {
            return target;
        }

        String compact = target.replace(" ", "").replace("_", "").toLowerCase(Locale.ROOT);

        if ("homebase".equals(compact)) {
            if (locations.contains("homebase")) {
                return "homebase";
            }
            if (locations.contains("home base")) {
                return "home base";
            }
            if (locations.contains("home_base")) {
                return "home_base";
            }
        }

        for (String saved : locations) {
            if (saved == null) {
                continue;
            }

            String savedCompact = saved.replace(" ", "").replace("_", "").toLowerCase(Locale.ROOT);

            if (savedCompact.equals(compact)) {
                return saved;
            }
        }

        return null;
    }

    private String normalizeTemiLocationName(String rawLocationName) {
        if (rawLocationName == null) {
            return "";
        }

        String key = rawLocationName.trim();
        String compactKey = key.replace(" ", "").replace("_", "").toLowerCase(Locale.ROOT);

        switch (compactKey) {
            case "a":
            case "a존":
            case "zonea":
            case "marker11":
            case "marker12":
            case "stamp1":
            case "1구역":
            case "1구역안내데스크":
                return "a";

            case "b":
            case "b존":
            case "zoneb":
            case "marker21":
            case "marker22":
            case "stamp2":
            case "2구역":
            case "2구역체험존":
                return "b";

            case "c":
            case "c존":
            case "zonec":
            case "marker31":
            case "marker32":
            case "stamp3":
            case "3구역":
            case "이벤트홀":
            case "eventhall":
            case "events":
                return "c";

            case "d":
            case "d존":
            case "zoned":
            case "4구역":
            case "특별기획":
            case "디지털아카이브":
            case "digitalarchive":
                return "d";

            case "home":
            case "homebase":
            case "홈":
            case "홈복귀":
            case "메인홀":
            case "main":
            case "mainhall":
            case "시작지점":
            case "출발지점":
            case "temi":
            case "테미":
            case "테미부르기":
                return "homebase";

            default:
                return key;
        }
    }

    private void emitSocketPosition(String locationId, String state) {
        if (socketService == null) {
            return;
        }

        String safeLocation = locationId == null ? "" : locationId.trim();
        String normalizedLocation = normalizeTemiLocationName(safeLocation);
        float[] pos = getUiPositionForLocation(normalizedLocation);

        socketService.emitPosition(
                pos[0],
                pos[1],
                pos[2],
                normalizedLocation,
                state == null ? "" : state
        );
    }

    // 실제 Temi 좌표 API를 쓰지 않고도 모바일 UI가 바뀌는지 확인할 수 있게
    // 전시 구역별 임시 좌표를 보낸다.
    private float[] getUiPositionForLocation(String locationId) {
        String key = normalizeTemiLocationName(locationId == null ? "" : locationId.trim());

        switch (key) {
            case "a":
                return new float[]{1.0f, 1.0f, 0.0f};
            case "b":
                return new float[]{2.0f, 1.0f, 0.0f};
            case "c":
                return new float[]{1.0f, 2.0f, 0.0f};
            case "d":
                return new float[]{2.0f, 2.0f, 0.0f};
            case "homebase":
                return new float[]{0.0f, 0.0f, 0.0f};
            case "follow":
                return new float[]{0.5f, 0.5f, 0.0f};
            case "ready":
            case "app_start":
                return new float[]{0.0f, 0.0f, 0.0f};
            default:
                return new float[]{0.0f, 0.0f, 0.0f};
        }
    }

    private void speak(String text) {
        String message = text == null ? "" : text.trim();

        if (message.isEmpty()) {
            return;
        }

        robot.speak(TtsRequest.create(message, false));
    }

    private void stopTemi() {
        try {
            robot.stopMovement();
        } catch (Exception ignored) {
        }

        navState = "idle";
        emitNavToWeb("idle", lastLocationId, "정지");
        emitSocketPosition(lastLocationId, navState);
        speak("정지했습니다.");
        toast("정지");
    }

    private void startPhotoBoothFromMobile() {
        mainHandler.post(() -> {
            try {
                speak("카메라를 준비합니다. 화면의 촬영 버튼을 누르면 네 컷 촬영이 시작됩니다.");

                if (webView == null) {
                    toast("WebView가 준비되지 않았습니다.");
                    return;
                }

                String url = PHOTO_CAPTURE_URL
                        + "?ready=1"
                        + "&t=" + System.currentTimeMillis();

                webView.loadUrl(url);
                toast("포토부스 준비 화면 실행");

            } catch (Exception e) {
                toast("포토부스 실행 실패: " + e.getMessage());
            }
        });
    }

    private void followMe() {
        try {
            robot.beWithMe();
            navState = "moving";
            emitNavToWeb("moving", "", "따라가기 시작");
            emitSocketPosition("follow", navState);
            speak("따라가겠습니다.");
            toast("따라가기 시작");
        } catch (Exception e) {
            navState = "error";
            emitNavToWeb("error", "", "따라가기 실패: " + e.getMessage());
            toast("따라가기 실패: " + e.getMessage());
        }
    }

    private void startNativeCameraPreview() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            pendingNativePreviewAfterPermission = true;
            ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.CAMERA},
                    REQUEST_CAMERA_PERMISSION
            );
            emitPhotoToWeb(false, "", "", "카메라 권한 요청 중입니다.");
            toast("카메라 권한 요청 중");
            return;
        }

        if (nativeCameraPreviewRunning || nativeCameraStarting) {
            emitPhotoToWeb(false, "", "", "카메라 미리보기 실행 중입니다.");
            return;
        }

        nativeCameraStarting = true;
        startCameraThread();

        CameraManager manager = (CameraManager) getSystemService(CAMERA_SERVICE);

        try {
            NativeCameraConfig config = findNativeCameraConfig(manager);

            if (config == null) {
                nativeCameraStarting = false;
                emitPhotoToWeb(false, "", "", "사용 가능한 카메라를 찾지 못했습니다.");
                speak("사용 가능한 카메라를 찾지 못했습니다.");
                return;
            }

            nativeImageReader = ImageReader.newInstance(
                    config.size.getWidth(),
                    config.size.getHeight(),
                    ImageFormat.JPEG,
                    2
            );

            nativeImageReader.setOnImageAvailableListener(
                    this::handleNativeImageAvailable,
                    cameraHandler
            );

            manager.openCamera(config.cameraId, new CameraDevice.StateCallback() {
                @Override
                public void onOpened(@NonNull CameraDevice camera) {
                    nativeCameraDevice = camera;
                    createNativePreviewSession();
                }

                @Override
                public void onDisconnected(@NonNull CameraDevice camera) {
                    emitPhotoToWeb(false, "", "", "카메라 연결이 끊어졌습니다.");
                    camera.close();
                    nativeCameraDevice = null;
                    nativeCameraStarting = false;
                    nativeCameraPreviewRunning = false;
                    nativePhotoBusy = false;
                }

                @Override
                public void onError(@NonNull CameraDevice camera, int error) {
                    emitPhotoToWeb(false, "", "", "카메라 오류: " + error);
                    camera.close();
                    nativeCameraDevice = null;
                    nativeCameraStarting = false;
                    nativeCameraPreviewRunning = false;
                    nativePhotoBusy = false;
                }
            }, cameraHandler);

        } catch (SecurityException e) {
            nativeCameraStarting = false;
            emitPhotoToWeb(false, "", "", "카메라 권한이 없습니다: " + e.getMessage());
        } catch (CameraAccessException e) {
            nativeCameraStarting = false;
            emitPhotoToWeb(false, "", "", "카메라 접근 실패: " + e.getMessage());
        } catch (Exception e) {
            nativeCameraStarting = false;
            emitPhotoToWeb(false, "", "", "카메라 시작 실패: " + e.getMessage());
        }
    }

    private void takeNativePhoto() {
        if (nativePhotoBusy) {
            emitPhotoToWeb(false, "", "", "이미 촬영 중입니다.");
            toast("이미 촬영 중입니다.");
            return;
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            pendingNativePhotoAfterPermission = true;
            ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.CAMERA},
                    REQUEST_CAMERA_PERMISSION
            );
            emitPhotoToWeb(false, "", "", "카메라 권한 요청 중입니다.");
            toast("카메라 권한 요청 중");
            return;
        }

        nativePhotoBusy = true;
        nativePhotoRequested = true;
        emitPhotoToWeb(false, "", "", "Temi 카메라 촬영 중…");

        if (!nativeCameraPreviewRunning && !nativeCameraStarting) {
            startNativeCameraPreview();
        }
    }

    private NativeCameraConfig findNativeCameraConfig(CameraManager manager) throws CameraAccessException {
        String fallbackCameraId = null;
        Size fallbackSize = null;

        String frontCameraId = null;
        Size frontSize = null;

        for (String id : manager.getCameraIdList()) {
            CameraCharacteristics characteristics = manager.getCameraCharacteristics(id);
            StreamConfigurationMap map = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP);

            if (map == null) {
                continue;
            }

            Size[] jpegSizes = map.getOutputSizes(ImageFormat.JPEG);
            Size selectedSize = chooseNativePhotoSize(jpegSizes);

            if (selectedSize == null) {
                continue;
            }

            if (fallbackCameraId == null) {
                fallbackCameraId = id;
                fallbackSize = selectedSize;
            }

            Integer facing = characteristics.get(CameraCharacteristics.LENS_FACING);

            if (facing != null && facing == CameraCharacteristics.LENS_FACING_FRONT) {
                frontCameraId = id;
                frontSize = selectedSize;
                break;
            }
        }

        if (frontCameraId != null) {
            return new NativeCameraConfig(frontCameraId, frontSize);
        }

        if (fallbackCameraId != null) {
            return new NativeCameraConfig(fallbackCameraId, fallbackSize);
        }

        return null;
    }

    private Size chooseNativePhotoSize(Size[] sizes) {
        if (sizes == null || sizes.length == 0) {
            return null;
        }

        Size smallest = sizes[0];

        for (Size size : sizes) {
            int w = size.getWidth();
            int h = size.getHeight();

            // 미리보기 이미지를 WebView로 계속 보내야 하므로 작은 해상도를 우선 사용한다.
            if (w <= 640 && h <= 480) {
                return size;
            }

            if (w * h < smallest.getWidth() * smallest.getHeight()) {
                smallest = size;
            }
        }

        return smallest;
    }

    private void createNativePreviewSession() {
        try {
            if (nativeCameraDevice == null || nativeImageReader == null) {
                nativeCameraStarting = false;
                nativeCameraPreviewRunning = false;
                nativePhotoBusy = false;
                emitPhotoToWeb(false, "", "", "카메라 세션 생성 실패");
                return;
            }

            Surface imageSurface = nativeImageReader.getSurface();

            nativeCameraDevice.createCaptureSession(
                    Collections.singletonList(imageSurface),
                    new CameraCaptureSession.StateCallback() {
                        @Override
                        public void onConfigured(@NonNull CameraCaptureSession session) {
                            nativeCaptureSession = session;
                            startNativeRepeatingPreview();
                        }

                        @Override
                        public void onConfigureFailed(@NonNull CameraCaptureSession session) {
                            nativeCameraStarting = false;
                            nativeCameraPreviewRunning = false;
                            nativePhotoBusy = false;
                            emitPhotoToWeb(false, "", "", "카메라 세션 설정 실패");
                            closeNativeCamera();
                        }
                    },
                    cameraHandler
            );

        } catch (CameraAccessException e) {
            nativeCameraStarting = false;
            nativeCameraPreviewRunning = false;
            nativePhotoBusy = false;
            emitPhotoToWeb(false, "", "", "카메라 세션 오류: " + e.getMessage());
            closeNativeCamera();
        }
    }

    private void startNativeRepeatingPreview() {
        try {
            if (nativeCameraDevice == null || nativeImageReader == null || nativeCaptureSession == null) {
                nativeCameraStarting = false;
                nativeCameraPreviewRunning = false;
                nativePhotoBusy = false;
                emitPhotoToWeb(false, "", "", "카메라가 아직 준비되지 않았습니다.");
                closeNativeCamera();
                return;
            }

            CaptureRequest.Builder previewBuilder =
                    nativeCameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);

            previewBuilder.addTarget(nativeImageReader.getSurface());
            previewBuilder.set(
                    CaptureRequest.CONTROL_AF_MODE,
                    CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE
            );

            // 이전 결과가 거꾸로 저장되었기 때문에 기본 JPEG 방향을 180도로 보정한다.
            previewBuilder.set(CaptureRequest.JPEG_ORIENTATION, 180);

            nativeCaptureSession.setRepeatingRequest(
                    previewBuilder.build(),
                    new CameraCaptureSession.CaptureCallback() {
                        @Override
                        public void onCaptureFailed(
                                @NonNull CameraCaptureSession session,
                                @NonNull CaptureRequest request,
                                @NonNull CaptureFailure failure
                        ) {
                            emitPhotoToWeb(false, "", "", "카메라 프레임 수신 실패: " + failure.getReason());
                        }
                    },
                    cameraHandler
            );

            nativeCameraStarting = false;
            nativeCameraPreviewRunning = true;
            emitPhotoToWeb(false, "", "", "카메라 미리보기 준비 완료");

        } catch (CameraAccessException e) {
            nativeCameraStarting = false;
            nativeCameraPreviewRunning = false;
            nativePhotoBusy = false;
            emitPhotoToWeb(false, "", "", "미리보기 시작 오류: " + e.getMessage());
            closeNativeCamera();
        }
    }

    private void handleNativeImageAvailable(ImageReader reader) {
        Image image = null;

        try {
            image = reader.acquireLatestImage();

            if (image == null) {
                return;
            }

            ByteBuffer buffer = image.getPlanes()[0].getBuffer();
            byte[] bytes = new byte[buffer.remaining()];
            buffer.get(bytes);

            long now = System.currentTimeMillis();

            if (nativePhotoRequested) {
                nativePhotoRequested = false;

                File photoFile = createNativeImageFile();

                try (FileOutputStream output = new FileOutputStream(photoFile)) {
                    output.write(bytes);
                }

                String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                String dataUrl = "data:image/jpeg;base64," + base64;
                String path = photoFile.getAbsolutePath();

                nativePhotoBusy = false;

                emitPhotoToWeb(true, dataUrl, path, "촬영 완료");
                speak("사진 촬영이 완료되었습니다.");
                return;
            }

            // 미리보기는 너무 자주 보내면 WebView가 버벅이므로 약 2fps로 제한한다.
            if (now - lastPreviewEmitMs >= 500L) {
                lastPreviewEmitMs = now;

                String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                String dataUrl = "data:image/jpeg;base64," + base64;

                emitPreviewToWeb(dataUrl, "미리보기");
            }

        } catch (Exception e) {
            nativePhotoBusy = false;
            emitPhotoToWeb(false, "", "", "카메라 프레임 처리 오류: " + e.getMessage());
        } finally {
            if (image != null) {
                image.close();
            }
        }
    }

    private File createNativeImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat(
                "yyyyMMdd_HHmmss_SSS",
                Locale.getDefault()
        ).format(new Date());

        String imageFileName = "TEMI_NATIVE_" + timeStamp + "_";

        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);

        if (storageDir == null) {
            storageDir = getFilesDir();
        }

        if (!storageDir.exists()) {
            //noinspection ResultOfMethodCallIgnored
            storageDir.mkdirs();
        }

        return File.createTempFile(
                imageFileName,
                ".jpg",
                storageDir
        );
    }

    private void startCameraThread() {
        if (cameraThread != null) {
            return;
        }

        cameraThread = new HandlerThread("TemiNativeCameraThread");
        cameraThread.start();
        cameraHandler = new Handler(cameraThread.getLooper());
    }

    private void stopCameraThread() {
        if (cameraThread == null) {
            return;
        }

        cameraThread.quitSafely();

        try {
            cameraThread.join();
        } catch (InterruptedException ignored) {
        }

        cameraThread = null;
        cameraHandler = null;
    }

    private void closeNativeCamera() {
        nativeCameraStarting = false;
        nativeCameraPreviewRunning = false;
        nativePhotoBusy = false;
        nativePhotoRequested = false;

        if (nativeCaptureSession != null) {
            nativeCaptureSession.close();
            nativeCaptureSession = null;
        }

        if (nativeCameraDevice != null) {
            nativeCameraDevice.close();
            nativeCameraDevice = null;
        }

        if (nativeImageReader != null) {
            nativeImageReader.close();
            nativeImageReader = null;
        }
    }

    private static class NativeCameraConfig {
        final String cameraId;
        final Size size;

        NativeCameraConfig(String cameraId, Size size) {
            this.cameraId = cameraId;
            this.size = size;
        }
    }

    private void injectTemiBridge() {
        mainHandler.post(() -> {
            if (webView == null) {
                return;
            }

            String js =
                    "(function() {" +
                            "window.TemiBridge = {" +
                            "  isAvailable: function() { return true; }," +
                            "  goto: function(locationId) {" +
                            "    var id = String(locationId || '').trim();" +
                            "    if (!id) return false;" +
                            "    try {" +
                            "      window.TemiNative.gotoLocation(id);" +
                            "      return true;" +
                            "    } catch (e) {" +
                            "      console.warn('[TemiBridge injected] goto error', e);" +
                            "      return false;" +
                            "    }" +
                            "  }," +
                            "  speak: function(text) {" +
                            "    var t = String(text || '').trim();" +
                            "    if (!t) return;" +
                            "    try { window.TemiNative.speak(t); } catch (e) { console.warn(e); }" +
                            "  }," +
                            "  stop: function() {" +
                            "    try { window.TemiNative.stop(); } catch (e) { console.warn(e); }" +
                            "  }," +
                            "  follow: function() {" +
                            "    try { window.TemiNative.follow(); } catch (e) { console.warn(e); }" +
                            "  }," +
                            "  startPhotoBooth: function() {" +
                            "    try {" +
                            "      window.TemiNative.startPhotoBooth();" +
                            "      return true;" +
                            "    } catch (e) {" +
                            "      console.warn('[TemiBridge injected] startPhotoBooth error', e);" +
                            "      return false;" +
                            "    }" +
                            "  }," +
                            "  startCameraPreview: function() {" +
                            "    try {" +
                            "      window.TemiNative.startCameraPreview();" +
                            "      return true;" +
                            "    } catch (e) {" +
                            "      console.warn('[TemiBridge injected] startCameraPreview error', e);" +
                            "      return false;" +
                            "    }" +
                            "  }," +
                            "  takePhoto: function() {" +
                            "    try {" +
                            "      window.TemiNative.takePhoto();" +
                            "      return true;" +
                            "    } catch (e) {" +
                            "      console.warn('[TemiBridge injected] takePhoto error', e);" +
                            "      return false;" +
                            "    }" +
                            "  }," +
                            "  getNavState: function() {" +
                            "    try { return String(window.TemiNative.getNavState()); } catch (e) { return 'error'; }" +
                            "  }," +
                            "  getLocations: function() {" +
                            "    try { return String(window.TemiNative.getLocations()); } catch (e) { return '[]'; }" +
                            "  }," +
                            "  _emitNav: function(detail) {" +
                            "    try {" +
                            "      window.dispatchEvent(new CustomEvent('temi:nav', { detail: detail || {} }));" +
                            "    } catch (e) {}" +
                            "  }," +
                            "  _emitPhoto: function(detail) {" +
                            "    try {" +
                            "      window.dispatchEvent(new CustomEvent('temi:photo-result', { detail: detail || {} }));" +
                            "    } catch (e) {}" +
                            "  }," +
                            "  _emitPhotoPreview: function(detail) {" +
                            "    try {" +
                            "      window.dispatchEvent(new CustomEvent('temi:photo-preview', { detail: detail || {} }));" +
                            "    } catch (e) {}" +
                            "  }" +
                            "};" +
                            "console.log('[TemiBridge injected] ready');" +
                            "})();";

            webView.evaluateJavascript(js, null);
        });
    }

    private void emitNavToWeb(String state, String locationId, String message) {
        mainHandler.post(() -> {
            if (webView == null) {
                return;
            }

            String safeState = escapeJs(state);
            String safeLocation = escapeJs(locationId);
            String safeMessage = escapeJs(message);

            String js =
                    "window.TemiBridge && window.TemiBridge._emitNav({" +
                            "state: '" + safeState + "'," +
                            "locationId: '" + safeLocation + "'," +
                            "message: '" + safeMessage + "'" +
                            "});";

            webView.evaluateJavascript(js, null);
        });
    }

    private void emitPhotoToWeb(boolean ok, String dataUrl, String path, String message) {
        mainHandler.post(() -> {
            if (webView == null) {
                return;
            }

            String safeDataUrl = escapeJs(dataUrl);
            String safePath = escapeJs(path);
            String safeMessage = escapeJs(message);

            String js =
                    "window.TemiBridge && window.TemiBridge._emitPhoto({" +
                            "ok: " + ok + "," +
                            "dataUrl: '" + safeDataUrl + "'," +
                            "path: '" + safePath + "'," +
                            "message: '" + safeMessage + "'" +
                            "});";

            webView.evaluateJavascript(js, null);
        });
    }

    private void emitPreviewToWeb(String dataUrl, String message) {
        mainHandler.post(() -> {
            if (webView == null) {
                return;
            }

            String safeDataUrl = escapeJs(dataUrl);
            String safeMessage = escapeJs(message);

            String js =
                    "window.TemiBridge && window.TemiBridge._emitPhotoPreview({" +
                            "dataUrl: '" + safeDataUrl + "'," +
                            "message: '" + safeMessage + "'" +
                            "});";

            webView.evaluateJavascript(js, null);
        });
    }

    private String escapeJs(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "");
    }

    private void toast(String message) {
        mainHandler.post(() ->
                Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show()
        );
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            @NonNull String[] permissions,
            @NonNull int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQUEST_CAMERA_PERMISSION) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;

            if (granted) {
                toast("카메라 권한 승인됨");
                emitPhotoToWeb(false, "", "", "카메라 권한 승인됨");

                if (pendingNativePreviewAfterPermission) {
                    pendingNativePreviewAfterPermission = false;
                    startNativeCameraPreview();
                }

                if (pendingNativePhotoAfterPermission) {
                    pendingNativePhotoAfterPermission = false;
                    takeNativePhoto();
                }
            } else {
                pendingNativePreviewAfterPermission = false;
                pendingNativePhotoAfterPermission = false;
                nativePhotoBusy = false;
                emitPhotoToWeb(false, "", "", "카메라 권한이 거부되었습니다.");
                speak("카메라 권한이 필요합니다.");
            }
        }
    }

    public class TemiNativeBridge {

        @JavascriptInterface
        public void gotoLocation(String locationName) {
            mainHandler.post(() -> MainActivity.this.goToLocation(locationName));
        }

        @JavascriptInterface
        public void speak(String text) {
            mainHandler.post(() -> MainActivity.this.speak(text));
        }

        @JavascriptInterface
        public void stop() {
            mainHandler.post(MainActivity.this::stopTemi);
        }

        @JavascriptInterface
        public void follow() {
            mainHandler.post(MainActivity.this::followMe);
        }

        @JavascriptInterface
        public void startPhotoBooth() {
            mainHandler.post(MainActivity.this::startPhotoBoothFromMobile);
        }

        @JavascriptInterface
        public void startCameraPreview() {
            mainHandler.post(MainActivity.this::startNativeCameraPreview);
        }

        @JavascriptInterface
        public void takePhoto() {
            mainHandler.post(MainActivity.this::takeNativePhoto);
        }

        @JavascriptInterface
        public String getNavState() {
            return navState;
        }

        @JavascriptInterface
        public String getLocations() {
            List<String> locations = robot.getLocations();
            return locations == null ? "[]" : locations.toString();
        }

        @JavascriptInterface
        public String getLastLocationId() {
            return lastLocationId == null ? "" : lastLocationId;
        }
    }
}
