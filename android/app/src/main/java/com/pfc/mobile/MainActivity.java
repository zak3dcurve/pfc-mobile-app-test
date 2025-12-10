package com.pfc.mobile;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1) REGISTER PLUGIN BEFORE super.onCreate
        Log.d(TAG, "⭐ Registering TopdonThermalPlugin BEFORE super.onCreate...");
        try {
            registerPlugin(TopdonThermalPlugin.class);
            Log.d(TAG, "✅ TopdonThermalPlugin registered successfully (before super.onCreate)!");
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to register plugin: " + e.getMessage());
            e.printStackTrace();
        }

        // 2) THEN call super
        super.onCreate(savedInstanceState);
    }
}
