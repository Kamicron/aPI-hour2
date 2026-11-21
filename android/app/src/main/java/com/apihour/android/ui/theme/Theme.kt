package com.apihour.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

/** Couleurs sémantiques fixes (statuts de session), indépendantes du thème dynamique. */
object StatusColors {
    val Running = Color(0xFF2E9E5B)
    val Paused = Color(0xFFF59E0B)
    val Stopped = Color(0xFFE5484D)
}

@Composable
fun ApiHourTheme(content: @Composable () -> Unit) {
    // minSdk 31 : les couleurs dynamiques (Material You) sont toujours disponibles.
    val context = LocalContext.current
    val colorScheme = if (isSystemInDarkTheme()) {
        dynamicDarkColorScheme(context)
    } else {
        dynamicLightColorScheme(context)
    }
    MaterialTheme(colorScheme = colorScheme, content = content)
}
