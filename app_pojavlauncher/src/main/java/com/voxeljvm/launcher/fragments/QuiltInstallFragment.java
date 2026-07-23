package com.voxeljvm.launcher.fragments;

import com.voxeljvm.launcher.modloaders.FabriclikeUtils;
import com.voxeljvm.launcher.modloaders.ModloaderListenerProxy;

public class QuiltInstallFragment extends FabriclikeInstallFragment {

    public static final String TAG = "QuiltInstallFragment";
    private static ModloaderListenerProxy sTaskProxy;

    public QuiltInstallFragment() {
        super(FabriclikeUtils.QUILT_UTILS, TAG);
    }
}
