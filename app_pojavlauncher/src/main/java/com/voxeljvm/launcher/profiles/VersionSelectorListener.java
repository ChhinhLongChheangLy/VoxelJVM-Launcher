package com.voxeljvm.launcher.profiles;

public interface VersionSelectorListener {
    void onVersionSelected(String versionId, boolean isSnapshot);
}
