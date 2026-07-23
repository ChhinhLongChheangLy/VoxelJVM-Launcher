package com.voxeljvm.launcher.customcontrols.mouse;

import android.view.MotionEvent;

public interface TouchEventProcessor {
    boolean processTouchEvent(MotionEvent motionEvent);
    void cancelPendingActions();
}
