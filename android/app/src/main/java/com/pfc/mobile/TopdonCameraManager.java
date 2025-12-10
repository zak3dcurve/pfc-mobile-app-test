package com.pfc.mobile;

import android.content.Context;
import android.graphics.Bitmap;
import android.hardware.usb.UsbDevice;
import android.util.Base64;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.infisense.iruvc.ircmd.IRCMD;
import com.infisense.iruvc.usb.USBMonitor;
import com.infisense.iruvc.utils.CommonParams;
import com.infisense.iruvc.uvc.UVCCamera;
import com.infisense.iruvc.uvc.UVCResult;
import com.infisense.iruvc.uvc.UVCType;

import java.io.ByteArrayOutputStream;

/**
 * Manages Topdon TC001 thermal camera integration
 * Uses official Topdon SDK (libusbIrsdk)
 * 
 * FINAL VERSION - Based on actual SDK documentation
 */
public class TopdonCameraManager {
    private static final String TAG = "TopdonCameraManager";
    
    private Context context;
    private USBMonitor usbMonitor;
    private IRCMD ircmd;
    private UVCCamera uvcCamera;
    private boolean isInitialized = false;
    private boolean isCameraConnected = false;
    
    private String lastError;

    public TopdonCameraManager(Context context) {
        this.context = context;
    }

    /**
     * Initialize the USB monitor and thermal camera
     */
public void initialize(final InitializeCallback callback) {
    if (isInitialized) {
        callback.onSuccess("Already initialized");
        return;
    }

    // 🔥 Always do USBMonitor stuff on the main (UI) thread
    new Handler(Looper.getMainLooper()).post(new Runnable() {
        @Override
        public void run() {
            try {
                Log.d(TAG, "Initializing Topdon thermal camera on UI thread...");
                Log.d(TAG, "Context class = " + context.getClass().getName());

                // 👇 Make sure context is an Activity (we passed getActivity() in the plugin)
                android.app.Activity activity = (android.app.Activity) context;

                usbMonitor = new USBMonitor(activity, new USBMonitor.OnDeviceConnectListener() {
                    @Override
                    public void onAttach(UsbDevice device) {
                        Log.d(TAG, "USB device attached: " + device.getDeviceName());
                        requestPermissionAndConnect(device);
                    }

                    @Override
                    public void onGranted(UsbDevice usbDevice, boolean createNew) {
                        Log.d(TAG, "USB permission granted for: " + usbDevice.getDeviceName());
                        if (usbMonitor != null) {
                            USBMonitor.UsbControlBlock ctrlBlock = usbMonitor.openDevice(usbDevice);
                            if (ctrlBlock != null) {
                                Log.d(TAG, "Got UsbControlBlock in onGranted, opening camera...");
                                openCamera(ctrlBlock);
                            } else {
                                Log.e(TAG, "openDevice returned null UsbControlBlock");
                            }
                        }
                    }

                    @Override
                    public void onDettach(UsbDevice device) {
                        Log.d(TAG, "USB device detached: " + device.getDeviceName());
                        isCameraConnected = false;
                        if (ircmd != null) {
                            ircmd.onDestroy();
                            ircmd = null;
                        }
                    }

                    @Override
                    public void onConnect(UsbDevice device, USBMonitor.UsbControlBlock ctrlBlock, boolean createNew) {
                        Log.d(TAG, "USB device connected: " + device.getDeviceName());
                        openCamera(ctrlBlock);
                    }

                    @Override
                    public void onDisconnect(UsbDevice device, USBMonitor.UsbControlBlock ctrlBlock) {
                        Log.d(TAG, "USB device disconnected: " + device.getDeviceName());
                        isCameraConnected = false;
                    }

                    @Override
                    public void onCancel(UsbDevice device) {
                        Log.d(TAG, "USB permission cancelled for device: " + device.getDeviceName());
                    }
                });

                // Register monitor on UI thread
                usbMonitor.register();
                isInitialized = true;
                Log.d(TAG, "USB monitor registered successfully");

                // 🔍 Check if a device is already connected
                try {
                    java.util.List<UsbDevice> devices = usbMonitor.getDeviceList();
                    if (devices != null && !devices.isEmpty()) {
                        UsbDevice device = devices.get(0);
                        Log.d(TAG, "Found already connected USB device: " + device.getDeviceName());
                        requestPermissionAndConnect(device); // will trigger onGranted/onConnect
                    } else {
                        Log.d(TAG, "No USB devices found at initialize()");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error while checking existing USB devices", e);
                }

                // ✅ Report status
                if (isCameraConnected) {
                    callback.onSuccess("Thermal camera initialized");
                } else {
                    callback.onSuccess("USB monitor initialized, waiting for camera");
                }

            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize thermal camera", e);
                callback.onError("Initialization failed: " + e.getMessage());
            }
        }
    });
}





















    /**
     * Request USB permission and connect to device
     */
    private void requestPermissionAndConnect(UsbDevice device) {
        if (usbMonitor != null) {
            usbMonitor.requestPermission(device);
        }
    }

    /**
     * Open the thermal camera using IRCMD
     */
private void openCamera(USBMonitor.UsbControlBlock ctrlBlock) {
    try {
        Log.d(TAG, "Opening thermal camera with SDK 1.3.7 ...");

        // 1) Create and configure UVCCamera
        uvcCamera = new UVCCamera();
        uvcCamera.setUvcType(UVCType.USB_UVC);  // IMPORTANT
        uvcCamera.setDefaultPreviewMode(
                CommonParams.FRAMEFORMATType.FRAME_FORMAT_YUYV
        );
        uvcCamera.setDefaultPreviewMinFps(1);
        uvcCamera.setDefaultPreviewMaxFps(25);
        uvcCamera.setDefaultBandwidth(1.0f);

        // 2) Allocate native object
        uvcCamera.onCreate();
        Log.d(TAG, "UVCCamera.onCreate done, nativePtr=" + uvcCamera.getNativePtr());

        // 3) Set preview size (SDK default is 256x192)
        int sizeResult = uvcCamera.setUSBPreviewSize(256, 192);
        Log.d(TAG, "setUSBPreviewSize result = " + sizeResult);

        // 4) Open the physical USB device
        int openResult = uvcCamera.openUVCCamera(ctrlBlock);
        Log.d(TAG, "openUVCCamera result = " + openResult);

        if (openResult != UVCResult.UVC_SUCCESS.getValue()) {
            lastError = "openUVCCamera failed: " + openResult;
            Log.e(TAG, lastError);
            return;   // ⛔ don’t mark camera as connected
        }

        // 5) Put camera in Y16/temperature mode if supported
        try {
            // on this SDK, 1 is usually the thermal/Y16 mode
            int fmRes = uvcCamera.setFrameMode(1);
            Log.d(TAG, "setFrameMode(1) result = " + fmRes);
        } catch (Throwable t) {
            Log.w(TAG, "setFrameMode(1) not supported or failed", t);
        }

        // 6) Start preview – required so IRCMD has frames to work with
        int startRes = uvcCamera.onStartPreview();
        Log.d(TAG, "onStartPreview result = " + startRes);

        // 7) Init IRCMD (temperature engine)
        ircmd = new IRCMD();
        ircmd.onCreate();

        isCameraConnected = true;
        Log.d(TAG, "Thermal camera opened successfully, isCameraConnected = true");

    } catch (Exception e) {
        Log.e(TAG, "Failed to open thermal camera", e);
        lastError = "Failed to open camera: " + e.getMessage();
    }
}


    /**
     * Check if camera is ready to capture
     */
    public boolean isReady() {
    boolean ready = isInitialized && isCameraConnected && ircmd != null;
    Log.d(TAG, "isReady() -> " + ready +
        " (isInitialized=" + isInitialized +
        ", isCameraConnected=" + isCameraConnected +
        ", ircmd=" + (ircmd != null) + ")");
    return ready;
}

    /**
     * Capture a thermal image
     * 
     * Note: The SDK doesn't have a direct "captureFrame" method.
     * We need to use UVCCamera to get frames.
     */
    public void captureImage(final CaptureCallback callback) {
        if (!isReady()) {
            callback.onError("Camera not ready. Please ensure Topdon TC001 is connected.");
            return;
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Log.d(TAG, "Capturing thermal image...");
                    
                    // The SDK uses UVCCamera for frame capture
                    // You need to set up a frame callback with UVCCamera
                    // This is typically done in the preview setup
                    
                    // For now, return error with instruction
                    notifyError(callback, 
                        "Image capture requires UVCCamera frame callback setup. " +
                        "Please implement UVCCamera.setFrameCallback() in your preview flow.");
                    
                } catch (Exception e) {
                    Log.e(TAG, "Failed to capture thermal image", e);
                    notifyError(callback, "Capture failed: " + e.getMessage());
                }
            }
        }).start();
    }

    /**
     * Get temperature at specific point
     * Uses SDK method: getPointTemperatureInfo
     */
    public void getPointTemperature(int x, int y, final TemperatureCallback callback) {
        if (!isReady()) {
            callback.onError("Camera not ready");
            return;
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    int[] temperatureValue = new int[1];
                    
                    // ✅ CORRECT METHOD from SDK docs
                    int result = ircmd.getPointTemperatureInfo(x, y, temperatureValue);
                    
                    if (result == 0) {
                        // Temperature is in Kelvin, convert to Celsius
                        float tempCelsius = (temperatureValue[0] / 16.0f) - 273.15f;
                        notifyTemperatureSuccess(callback, tempCelsius);
                    } else {
                        notifyTemperatureError(callback, "Failed to get temperature");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error getting temperature", e);
                    notifyTemperatureError(callback, e.getMessage());
                }
            }
        }).start();
    }

    /**
     * Get center temperature
     * Uses SDK methods for frame min/max temperature
     */
    public void getCenterTemperature(final TemperatureCallback callback) {
        if (!isReady()) {
            callback.onError("Camera not ready");
            return;
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    int[] maxTemp = new int[1];
                    int[] minTemp = new int[1];
                    
                    // ✅ CORRECT METHODS from SDK docs
                    ircmd.getCurrentFrameMaxTemperature(maxTemp);
                    ircmd.getCurrentFrameMinTemperature(minTemp);
                    
                    // Calculate average as "center" temperature
                    float avgKelvin = (maxTemp[0] + minTemp[0]) / 2.0f;
                    float tempCelsius = (avgKelvin / 16.0f) - 273.15f;
                    
                    notifyTemperatureSuccess(callback, tempCelsius);
                    
                } catch (Exception e) {
                    Log.e(TAG, "Error getting center temperature", e);
                    notifyTemperatureError(callback, e.getMessage());
                }
            }
        }).start();
    }

    /**
     * Convert bitmap to base64 string
     */
    private String bitmapToBase64(Bitmap bitmap) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream);
        byte[] byteArray = outputStream.toByteArray();
        return Base64.encodeToString(byteArray, Base64.NO_WRAP);
    }

    /**
     * Notify success on main thread
     */
    private void notifySuccess(final CaptureCallback callback, final JSObject result) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                callback.onSuccess(result);
            }
        });
    }

    /**
     * Notify error on main thread
     */
    private void notifyError(final CaptureCallback callback, final String error) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                callback.onError(error);
            }
        });
    }

    /**
     * Notify temperature success on main thread
     */
    private void notifyTemperatureSuccess(final TemperatureCallback callback, final float temperature) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                callback.onSuccess(temperature);
            }
        });
    }

    /**
     * Notify temperature error on main thread
     */
    private void notifyTemperatureError(final TemperatureCallback callback, final String error) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                callback.onError(error);
            }
        });
    }

    /**
     * Get list of connected USB devices
     */
    public String getConnectedDevices() {
        if (usbMonitor == null) {
            return "USB monitor not initialized";
        }
        
        StringBuilder devices = new StringBuilder();
        devices.append("Connected USB devices:\n");
        
        try {
java.util.List<UsbDevice> deviceList = usbMonitor.getDeviceList();
if (deviceList == null || deviceList.isEmpty()) {
    devices.append("No devices found");
} else {
    for (UsbDevice device : deviceList) {
        devices.append("- ").append(device.getDeviceName())
               .append(" (VID: ").append(device.getVendorId())
               .append(", PID: ").append(device.getProductId())
               .append(")\n");
    }
}

        } catch (Exception e) {
            devices.append("Error getting devices: ").append(e.getMessage());
        }
        
        return devices.toString();
    }

    /**
     * Release all camera resources
     */
    public void release() {
        Log.d(TAG, "Releasing thermal camera resources...");
        
        try {
            if (ircmd != null) {
                ircmd.onDestroy(); // ✅ CORRECT METHOD from SDK docs: "资源回收"
                ircmd = null;
            }
            
            if (uvcCamera != null) {
 uvcCamera.closeUVCCamera();
                uvcCamera = null;
            }
            
            if (usbMonitor != null) {
                usbMonitor.unregister();
                usbMonitor = null;
            }
            
            isCameraConnected = false;
            isInitialized = false;
            
            Log.d(TAG, "Camera resources released");
        } catch (Exception e) {
            Log.e(TAG, "Error releasing camera resources", e);
        }
    }

    // Callback interfaces
    public interface InitializeCallback {
        void onSuccess(String message);
        void onError(String error);
    }

    public interface CaptureCallback {
        void onSuccess(JSObject result);
        void onError(String error);
    }

    public interface TemperatureCallback {
        void onSuccess(float temperature);
        void onError(String error);
    }
}