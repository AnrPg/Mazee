package com.mazee.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable

@Composable
fun mazeeTheme(content: @Composable () -> Unit) {
  MaterialTheme(
    colorScheme = MaterialTheme.colorScheme,
    typography = MaterialTheme.typography,
    shapes = MaterialTheme.shapes,
    content = content
  )
}
