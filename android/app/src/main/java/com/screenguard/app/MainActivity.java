package com.screenguard.app;

import com.getcapacitor.BridgeActivity;
import com.screenguard.app.plugins.BlockerPlugin;
import com.screenguard.app.plugins.ScreenTimePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(BlockerPlugin.class);
        registerPlugin(ScreenTimePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
