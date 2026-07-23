package com.voxeljvm.launcher.customcontrols.gamepad;

import com.voxeljvm.launcher.GrabListener;

public interface GamepadDataProvider {
    GamepadMap getMenuMap();
    GamepadMap getGameMap();
    boolean isGrabbing();
    void attachGrabListener(GrabListener grabListener);
    void detachGrabListener(GrabListener grabListener);
}
