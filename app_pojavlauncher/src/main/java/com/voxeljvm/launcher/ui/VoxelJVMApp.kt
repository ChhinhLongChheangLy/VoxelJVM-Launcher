package com.voxeljvm.launcher.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun VoxelJVMApp() {
    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            VoxelJVMHomeScreen()
        }
    }
}
