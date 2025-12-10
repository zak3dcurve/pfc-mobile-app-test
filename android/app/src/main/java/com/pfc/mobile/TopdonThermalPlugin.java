package com.pfc.mobile;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin for Topdon TC001 thermal camera integration
 */
@CapacitorPlugin(name = "TopdonThermal")
public class TopdonThermalPlugin extends Plugin {
    
    private TopdonCameraManager cameraManager;
    
@Override
public void load() {
    android.util.Log.d("TopdonThermalPlugin", "🔥🔥🔥 TopdonThermalPlugin.load() STARTING");
    super.load();
    try {
        // 👇 IMPORTANT: use Activity, not Application context
        cameraManager = new TopdonCameraManager(getActivity());
        android.util.Log.d("TopdonThermalPlugin", "🔥🔥🔥 TopdonThermalPlugin.load() SUCCESS (using Activity context)");
    } catch (Throwable t) {
        android.util.Log.e("TopdonThermalPlugin", "🔥🔥🔥 TopdonThermalPlugin.load() FAILED", t);
    }
}


    /**
     * Initialize the thermal camera
     */
    @PluginMethod
    public void initialize(PluginCall call) {
        cameraManager.initialize(new TopdonCameraManager.InitializeCallback() {
            @Override
            public void onSuccess(String message) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("message", message);
                call.resolve(ret);
            }

            @Override
            public void onError(String error) {
                call.reject(error);
            }
        });
    }

    /**
     * Check if camera is ready
     */
    @PluginMethod
    public void isReady(PluginCall call) {
        boolean ready = cameraManager.isReady();
        JSObject ret = new JSObject();
        ret.put("ready", ready);
        call.resolve(ret);
    }

    /**
     * Capture a thermal image
     */
    @PluginMethod
    public void captureImage(PluginCall call) {
        cameraManager.captureImage(new TopdonCameraManager.CaptureCallback() {
            @Override
            public void onSuccess(JSObject result) {
                call.resolve(result);
            }

            @Override
            public void onError(String error) {
                call.reject(error);
            }
        });
    }

    /**
     * Get list of connected USB devices (for debugging)
     */
    @PluginMethod
    public void getConnectedDevices(PluginCall call) {
        String devices = cameraManager.getConnectedDevices();
        JSObject ret = new JSObject();
        ret.put("devices", devices);
        call.resolve(ret);
    }

    /**
     * Release camera resources
     */
    @PluginMethod
    public void release(PluginCall call) {
        cameraManager.release();
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Camera released");
        call.resolve(ret);
    }

    @Override
    protected void handleOnDestroy() {
        if (cameraManager != null) {
            cameraManager.release();
        }
        super.handleOnDestroy();
    }

    @PluginMethod
public void ping(PluginCall call) {
    android.util.Log.d("TopdonThermalPlugin", "🔥 ping() called from JS");
    JSObject ret = new JSObject();
    ret.put("ok", true);
    ret.put("platform", "android");
    call.resolve(ret);
}

}