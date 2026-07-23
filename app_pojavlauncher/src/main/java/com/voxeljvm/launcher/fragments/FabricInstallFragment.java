package com.voxeljvm.launcher.fragments;

import com.voxeljvm.launcher.modloaders.FabriclikeUtils;
import com.voxeljvm.launcher.modloaders.ModloaderListenerProxy;

public class FabricInstallFragment extends FabriclikeInstallFragment {

    public static final String TAG = "FabricInstallFragment";

    public FabricInstallFragment() {
        super(FabriclikeUtils.FABRIC_UTILS, TAG);
    }
}
